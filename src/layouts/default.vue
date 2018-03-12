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
        <q-btn
        icon="delete_sweep"
        flat
        @click="removeAllNumbers()"
        >
          Clear All ( {{ $q.localStorage.get.item('numbers') !== null ? $q.localStorage.get.item('numbers').length : 0
          }} )
        </q-btn>
        <q-btn
        icon="picture_as_pdf"
        flat
        @click="generatePDF()">
          Generate PDF
        </q-btn>
      </q-toolbar>
    </q-layout-header>
    
    <q-layout-drawer
    v-model="leftDrawerOpen"
    content-class="bg-grey-2"
    >
      <q-list
      no-border
      link
      inset-delimiter
      >
        <q-list-header>
          Numbers
        </q-list-header>
        <q-item>
          <q-item-side icon="add_circle_outline"/>
          <q-item-main>
            <q-input v-model="input"
                     stack-label="Enter Number (1234, 3345, 554)"
                     color="grey-7"
                     type="textarea"
                     :min-rows="50"
                     @enter="addNumber"
                     :after="[
                              {
                                icon: 'arrow_forward',
                                content: true,
                                handler () {
                                  addNumber()
                                }
                              }
                            ]"/>
          </q-item-main>
        </q-item>
        <q-item v-for="(number, index) in $q.localStorage.get.item('numbers')" :key="index">
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
  import {openURL, LocalStorage, uid} from 'quasar'
  import jsPDF from 'jspdf'
  import {autoTable, autoTableHtmlToJson} from 'jspdf-autotable'
  import Combinatorics from 'js-combinatorics'
  import permutations from 'permutation'
  import {
    QSpinnerCube
  } from 'quasar'
  
  export default {
    name: 'LayoutDefault',
    data () {
      return {
        input: '',
        numberKey: 'numbers',
        mutatedNumbersKey: 'mutatedNumbers',
        numbers: [],
        tempNumbers: [],
        mutatedNumbers: [],
        leftDrawerOpen: this.$q.platform.desktop
      }
    },
    methods: {
      openURL,
      addNumber () {
        this.tempNumbers = this.input.split(/\s+/)
        this.tempNumbers.forEach((x) => {
          if (x !== '') {
            let cmb = permutations(x, {unique: true})
            let mutatedNumbersStorage = this.$q.localStorage.get.item(this.mutatedNumbersKey)
            if (mutatedNumbersStorage !== null && mutatedNumbersStorage.length > 0) {
              this.mutatedNumbers = [...new Set([...mutatedNumbersStorage, ...cmb])]
            } else {
              this.mutatedNumbers = cmb
            }
            this.$q.localStorage.set(this.mutatedNumbersKey, this.mutatedNumbers)
            let items = this.$q.localStorage.get.item(this.numberKey)
            if (items !== null && items.length > 0) {
              items.forEach((item) => {
                this.numbers.push(item)
              })
            }
            this.numbers.push(x)
          }
        })
        
        this.$q.localStorage.set(this.numberKey, this.numbers)
        this.tempNumbers = []
        this.numbers = []
        this.input = ''
        this.$router.push('loading')
      },
      removeAllNumbers () {
        this.$router.push('loading')
        this.$q.localStorage.remove(this.numberKey)
        this.$q.localStorage.remove(this.mutatedNumbersKey)
      },
      generatePDF () {
        this.$q.loading.show({
          spinner: QSpinnerCube,
          spinnerSize: 250, // in pixels
          spinnerColor: 'white',
          customClass: 'bg-negative'
        })
        let id = uid()
        let element = document.getElementById('pdf-table')
        let doc = new jsPDF('p', 'pt')
        let res = doc.autoTableHtmlToJson(element)
        var totalPagesExp = "{total_pages_count_string}"
        var pageContent = function (data) {
          // HEADER
          doc.setFontSize(20)
          doc.setTextColor(40)
          doc.setFontStyle('normal')
          
          // FOOTER
          var str = "Page " + data.pageCount
          // Total page number plugin only available in jspdf v1.0+
          if (typeof doc.putTotalPages === 'function') {
            str = str + " of " + totalPagesExp
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
