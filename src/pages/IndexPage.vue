<template>
  <q-page class="q-pa-lg">
    <div class="row q-col-gutter-lg justify-end">
      <div class="col-lg-auto">
        <q-btn v-if="mutatedNumbers && mutatedNumbers.length > 0"
               icon="picture_as_pdf"
               color="positive"
               label="Generate PDF"
               @click="generatePDF">
        </q-btn>
      </div>
      <div class="col-12">
        <q-virtual-scroll
            id="pdf-table"
            type="table"
            style="max-height: 80vh"
            :virtual-scroll-item-size="48"
            :virtual-scroll-sticky-size-start="48"
            :virtual-scroll-sticky-size-end="32"
            :items="items"
        >
          <template v-slot:before>
            <thead class="thead-sticky text-left">
            <tr>
              <th>#</th>
              <th v-for="col in columns" :key="'1--' + col.name">
                {{ col.name }}
              </th>
            </tr>
            </thead>
          </template>

          <template v-slot:after>
            <tfoot class="tfoot-sticky text-left">
            <tr>
              <th>#</th>
              <th v-for="col in columns" :key="'2--' + col.name">
                {{ col.name }}
              </th>
            </tr>
            </tfoot>
          </template>

          <template v-slot="{ item: row, index }">
            <tr :key="index">
              <td>#{{ index }}</td>
              <td v-for="col in columns" :key="index + '-' + col.name">
                {{ row[col.prop] }}
              </td>
            </tr>
          </template>
        </q-virtual-scroll>
      </div>
    </div>
  </q-page>
</template>

<script>
import {defineComponent, onMounted, ref, nextTick } from 'vue'
import {liveQuery} from 'dexie'
import {useObservable} from '@vueuse/rxjs'
import {db} from 'src/utils/dexie'
import {QSpinnerGears, uid, useQuasar} from 'quasar'
import jsPDF from 'jspdf'
import {autoTable, autoTableHtmlToJson} from 'jspdf-autotable'

import Worker from "worker-loader!../worker"

const worker = new Worker();

export default defineComponent({
  name: 'IndexPage',
  setup() {

    const $q = useQuasar()

    let rows = ref(10)
    let cols = ref(0)
    let items = ref([])

    let digit = useObservable(
        liveQuery(async () => {
          let result = await db.settings.get({key: 'digit'})
          return result ? result.value : 4
        })
    )

    let showTotal = useObservable(
        liveQuery(async () => {
          let result = await db.settings.get({key: 'showTotal'})
          return result ? result.value : 4
        })
    )

    let reverseState = useObservable(
        liveQuery(async () => {
          let result = await db.settings.get({key: 'reverseState'})
          return result ? result.value : false
        })
    )

    let disablePermutation = useObservable(
      liveQuery(async () => {
        let result = await db.settings.get({key: 'disablePermutation'})
        return result ? result.value : false
      })
    )
    let numbers = useObservable(
      liveQuery(async () => {
        let result = await db.numbers.toArray()
        return result.length > 0 ? JSON.parse(result[0].value) : []
      })
    )

    let mutatedNumbers = useObservable(
        liveQuery(async () => {
          let result = await db.mutatedNumbers.toArray()
          return result.length > 0 ? JSON.parse(result[0].value) : []
        })
    )

    let comparedNumbers = useObservable(
      liveQuery(async () => {
        let result = await db.comparedNumbers.toArray()
        return result.length > 0 ? JSON.parse(result[0].value) : []
      })
    )

    const columns = [
      {title: '#1#', name: '#1#', prop: '1', dataKey: '1'},
      {title: '#2#', name: '#2#', prop: '2', dataKey: '2'},
      {title: '#3#', name: '#3#', prop: '3', dataKey: '3'},
      {title: '#4#', name: '#4#', prop: '4', dataKey: '4'},
      {title: '#5#', name: '#5#', prop: '5', dataKey: '5'},
      {title: '#6#', name: '#6#', prop: '6', dataKey: '6'},
      {title: '#7#', name: '#7#', prop: '7', dataKey: '7'},
      {title: '#8#', name: '#8#', prop: '8', dataKey: '8'},
      {title: '#9#', name: '#9#', prop: '9', dataKey: '9'},
      {title: '#10#', name: '#10#', prop: '10', dataKey: '10'},
    ]

    const updateComparedNumbers = async (data = []) => {
      let items = data
      items = JSON.stringify(items)
      let comparedNumbersExist = await db.comparedNumbers.get('comparedNumbers')
      if (comparedNumbersExist) {
        await db.comparedNumbers.put({
          key: 'comparedNumbers',
          value: items
        })
      } else {
        await db.comparedNumbers.add({
          key: 'comparedNumbers',
          value: items
        })
      }
    }

    let makeNumbers = () => {

      $q.loading.show({
        spinner: QSpinnerGears,
        spinnerSize: 150, // in pixels
        spinnerColor: 'white',
        customClass: 'bg-negative'
      })

      worker.postMessage(
        {
          numbers: JSON.stringify(numbers.value),
          mutatedNumbers: JSON.stringify(mutatedNumbers.value),
          length: digit.value,
          operation: 'rebuild',
          reverseState: reverseState.value,
          disablePermutation: disablePermutation.value,
          rows: rows.value,
          cols: cols.value,
        }
      );
    }

    worker.addEventListener('message', handleMessage);

    async function handleMessage(e) {
      items.value = e.data.items || []
      await updateComparedNumbers(e.data.availableNumbers || [])
      await new Promise(resolve => setTimeout(resolve, 1500))
      $q.loading.hide()
    }

    return {
      db,
      digit,
      mutatedNumbers,
      comparedNumbers,
      reverseState,
      disablePermutation,
      cols,
      rows,
      items,
      columns,
      showTotal,
      makeNumbers,
    }
  },
  watch: {
    digit: {
      handler() {
        this.setCols()
        this.makeNumbers()
      },
      immediate: true
    },
    mutatedNumbers: {
      handler() {
        this.setCols()
        this.makeNumbers()
      },
      immediate: true,
      deep: true
    },
    reverseState: {
      handler() {
        this.makeNumbers()
      },
      immediate: true,
      deep: true
    },
    disablePermutation: {
      handler() {
        this.makeNumbers()
      },
      immediate: true,
      deep: true
    },
    cols: {
      handler() {
        this.makeNumbers()
      },
      immediate: true,
      deep: true
    },
  },
  methods: {
    async generatePDF() {
      this.$q.loading.show({
        spinner: QSpinnerGears,
        spinnerSize: 150,
        spinnerColor: 'white',
        customClass: 'bg-negative'
      })

      await new Promise((resolve) => setTimeout(resolve,500));

      let id = uid()
      let element = document.getElementById('pdf-table')
      let doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt'
      })
      //let res = doc.autoTableHtmlToJson(element)
      let count = this.comparedNumbers.length
      let totalPagesExp = '{total_pages_count_string}'
      let pageContent = (data) => {
        // HEADER
        doc.setTextColor(100)
        doc.setFontStyle('normal')

        // FOOTER
        let str = 'Page ' + data.pageCount
        // Total page number plugin only available in jspdf v1.0+
        if (typeof doc.putTotalPages === 'function') {
          if (this.showTotal) {
            if (this.reverseState) {
              str = str + ' of ' + totalPagesExp + ' - [ Total Available ' + count + '/' + this.digit === 4 ? 10000 : 1000 + ']' + ' ------ [ Total Removed ' + ((this.digit === 4 ? 10000 : 1000) - count) + '/' + (this.digit === 4 ? 10000 : 1000) + ']'
            } else {
              str = str + ' of ' + totalPagesExp + ' - [ Total Available ' + ((this.digit === 4 ? 10000 : 1000) - count) + '/' + (this.digit === 4 ? 10000 : 1000) + ']' + ' ------ [ Total Removed ' + count + '/' + (this.digit === 4 ? 10000 : 1000) + ']'
            }
          } else {
            str = str + ' of ' + totalPagesExp
          }
        }
        doc.setFontSize(9)
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10)
      }
      doc.autoTable(this.columns, this.items, {
        addPageContent: pageContent,
        margin: {top: 30},
        theme: 'grid',
        headerStyles: {
          fillColor: [0, 0, 0],
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9,
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
    },
    setCols() {
      this.cols = this.digit === 4 ? 10000 : 1000
    }
  }
})
</script>
