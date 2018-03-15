<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header class="print-hide">
      <q-toolbar color="negative" glossy>
        <q-btn
        flat
        dense
        round
        @click="leftDrawerOpen = !leftDrawerOpen"
        >
          <q-icon name="menu"/>
        </q-btn>
        <q-toolbar-title>
          Permutation App
          <div slot="subtitle">Running on v1.0.0</div>
        </q-toolbar-title>
        <div class="row gutter-sm items-center">
          <div class="col-lg-auto">
            <q-btn v-if="input !== ''"
                   color="white text-black"
                   icon="add"
                   @click="addNumber()">Add Numbers
            </q-btn>
          </div>
          <div class="col-lg-auto">
            <q-btn v-if="numbers !== null && numbers.length > 0"
                   icon="delete_sweep"
                   color="white text-black"
                   @click="removeAllNumbers()"
            >Clear All ( {{ numbers !== null ? numbers.length : 0
              }} )
            </q-btn>
          </div>
          <div class="col-lg-auto">
            <q-btn v-if="mutatedNumbers !== null && mutatedNumbers.length > 0"
                   icon="picture_as_pdf"
                   color="white text-black"
                   @click="generatePDF()">
              Generate PDF
            </q-btn>
          </div>
          <div class="col-lg-auto" v-if="mutatedNumbers !== null">
            {{ reverseState ? (10000 - mutatedNumbers.length) : mutatedNumbers.length }} / 10000
          </div>
        </div>
      </q-toolbar>
    </q-layout-header>
    
    <q-layout-drawer
    v-model="leftDrawerOpen"
    content-class="bg-grey-2"
    >
      <q-list
      no-border
      inset-delimiter
      >
        <q-list-header>Settings</q-list-header>
        <q-item tag="label" multiline>
          <q-item-main>
            <q-item-tile label>Reverse Action</q-item-tile>
            <q-item-tile sublabel>Remove unused numbers</q-item-tile>
          </q-item-main>
          <q-item-side right>
            <q-toggle v-model="reverseState" color="amber"/>
          </q-item-side>
        </q-item>
        <q-item-separator/>
        <q-list-header>
          Form
        </q-list-header>
        <q-item>
          <q-item-main>
            <q-input v-model="input"
                     stack-label="Enter Number (1234, 3345, 554)"
                     color="grey-7"
                     type="textarea"
                     :min-rows="50"/>
          </q-item-main>
        </q-item>
        <q-item v-for="(number, index) in numbers" :key="index">
          <q-item-side icon="lense" color="positive"/>
          <q-item-main>
            <q-item-tile label>{{ number }}</q-item-tile>
          </q-item-main>
          <q-item-side right icon="info"/>
        </q-item>
      </q-list>
    </q-layout-drawer>
    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script>
  import Vue from 'vue'
  import {openURL, LocalStorage, uid} from 'quasar'
  import jsPDF from 'jspdf'
  import {autoTable, autoTableHtmlToJson} from 'jspdf-autotable'
  import permutations from 'permutation'
  import pad from 'pad-number'
  import reactiveStorage from "vue-reactivestorage";
  import {
    QSpinnerGears
  } from 'quasar'
  
  Vue.use(reactiveStorage, [
    'reverseState',
    'mutatedNumbers',
    'comparedNumbers',
    'numbers'
  ])
  
  export default {
    name: 'LayoutDefault',
    data () {
      return {
        input: '',
        localNumbers: [],
        tempNumbers: [],
        leftDrawerOpen: this.$q.platform.desktop
      }
    },
    computed: {
      reverseState: {
        get: function () {
          return this.localStorage.reverseState !== null ? this.localStorage.reverseState : false
        },
        set: function (value) {
          this.localStorage.reverseState = value
        }
      },
      mutatedNumbers: {
        get: function () {
          return this.localStorage.mutatedNumbers !== null ? this.localStorage.mutatedNumbers : []
        },
        set: function (value) {
          this.localStorage.mutatedNumbers = value
        }
      },
      comparedNumbers: {
        get: function () {
          return this.localStorage.comparedNumbers !== null ? this.localStorage.comparedNumbers : []
        },
        set: function (value) {
          this.localStorage.comparedNumbers = value
        }
      },
      numbers: {
        get: function () {
          return this.localStorage.numbers !== null ? this.localStorage.numbers : []
        },
        set: function (value) {
          this.localStorage.numbers = value
        }
      }
    },
    methods: {
      openURL,
      addNumber () {
        this.$q.loading.show({
          spinner: QSpinnerGears,
          spinnerSize: 150, // in pixels
          spinnerColor: 'white',
          customClass: 'bg-negative'
        })
        setTimeout(() => {
          this.tempNumbers = this.input.split(/\s+/)
          let mutationPromise = Promise.resolve(this.tempNumbers.forEach((x) => {
            if (x !== '' && x.length <= 4 && Number(x) || x === '0000' || x === '000' || x === '00' || x === '0') {
              x = pad(x, 4)
              let cmb = permutations(x, {unique: true})
              let mutatedNumbersStorage = this.localStorage.mutatedNumbers
              if (mutatedNumbersStorage !== null && mutatedNumbersStorage.length > 0) {
                this.mutatedNumbers = [...new Set([...mutatedNumbersStorage, ...cmb])]
              } else {
                this.mutatedNumbers = cmb
              }
              this.localNumbers.push(x)
              this.localStorage.mutatedNumbers = this.mutatedNumbers
            }
          }))
          
          let items = this.localStorage.numbers
          if (items !== null && items.length > 0) {
            items.forEach((item) => {
              this.localNumbers.push(item)
            })
          }
          
          this.localStorage.numbers = this.localNumbers
          this.tempNumbers = []
          this.localNumbers = []
          this.input = ''
          Promise.all([mutationPromise]).then(() => {
            this.$q.loading.hide()
          })
        }, 1000)
      },
      removeAllNumbers () {
        this.mutatedNumbers = []
        this.numbers = []
        this.comparedNumbers = []
      },
      generatePDF () {
        this.$q.loading.show({
          spinner: QSpinnerGears,
          spinnerSize: 150,
          spinnerColor: 'white',
          customClass: 'bg-negative'
        })
        let id = uid()
        let element = document.getElementById('pdf-table')
        let doc = new jsPDF({
          orientation: 'landscape',
          unit: 'pt'
        })
        let res = doc.autoTableHtmlToJson(element)
        let count = this.mutatedNumbers.length
        var totalPagesExp = "{total_pages_count_string}"
        var pageContent = (data) => {
          // HEADER
          doc.setFontSize(25)
          doc.setTextColor(100)
          doc.setFontStyle('normal')
          
          // FOOTER
          var str = 'Page ' + data.pageCount
          // Total page number plugin only available in jspdf v1.0+
          if (typeof doc.putTotalPages === 'function') {
            if (this.reverseState) {
              str = str + ' of ' + totalPagesExp + ' - [Total Available ' + (10000 - count) + '/ 10000]'
            } else {
              str = str + ' of ' + totalPagesExp + ' - [Total Removed ' + count + '/ 10000]'
            }
          }
          doc.setFontSize(10)
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10)
        }
        doc.autoTable(res.columns, res.data, {
          addPageContent: pageContent,
          margin: {top: 30},
          theme: 'grid',
          headerStyles: {
            fillColor: [0, 0, 0],
            fontSize: 15
          },
          bodyStyles: {
            fontSize: 21,
            textColor: 0
          }
        })
        
        // Total page number plugin only available in jspdf v1.0+
        if (typeof doc.putTotalPages === 'function') {
          doc.putTotalPages(totalPagesExp)
        }
        let generatePdfPromise = Promise.resolve(doc.save(id))
        Promise.all([generatePdfPromise]).then(() => {
          this.$q.loading.hide()
        })
      }
    }
  }
</script>

<style>
</style>
