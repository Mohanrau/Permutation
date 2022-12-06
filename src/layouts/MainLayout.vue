<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-negative">
      <q-toolbar>
        <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="toggleLeftDrawer = !toggleLeftDrawer"
        />

        <q-toolbar-title>
          Permutation App
        </q-toolbar-title>
        <div class="row q-col-gutter-md items-center">
          <div class="col-lg-auto">
            <q-btn v-if="input !== ''"
                   color="white text-black"
                   icon="add"
                   @click="addNumber()">Add Numbers
            </q-btn>
          </div>
          <div class="col-lg-auto">
            <q-btn v-if="numbers && numbers.length > 0"
                   icon="delete_sweep"
                   color="white text-black"
                   @click="removeAllNumbers()"
            >Clear All ( {{
                numbers ? numbers.length : 0
              }} )
            </q-btn>
          </div>
          <div class="col-lg-auto">
            <q-btn v-if="mutatedNumbers && mutatedNumbers.length > 0"
                   icon="vertical_split"
                   color="white text-black"
                   @click="exportToXLSX">
              Export To Excel
            </q-btn>
          </div>
          <div class="col-lg-auto" v-if="mutatedNumbers">
            {{ reverseState ? mutatedNumbers.length : ((digit === 4 ? 100000 : 1000) - mutatedNumbers.length) }}/
            {{ (digit === 4 ? 100000 : 1000) }}
          </div>
          <div class="col-lg-auto">Running on v2.0.0</div>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
        v-model="toggleLeftDrawer"
        show-if-above
        bordered
    >
      <q-list>
        <q-item-label
            header
        >
          Settings
        </q-item-label>

        <q-item>
          <q-item-section>
            <q-item-label>
              <q-select
                  hide-underline
                  class="q-ma-none full-width"
                  @input="removeAllNumbers"
                  v-model="digit"
                  map-options
                  emit-value
                  :options="digitOptions"
                  @update:model-value="updateDigit"
              />
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>
              Reverse Action
            </q-item-label>
            <q-item-label caption>
              Remove unused numbers
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="reverseState" color="amber" @update:model-value="updateReverseState"/>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>
              Number Substitute
            </q-item-label>
            <q-item-label caption>
              Replace number in sequence
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="localSub" color="amber"/>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label>
              Total
            </q-item-label>
            <q-item-label caption>
              Enable or Disable Total information at PDF
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle v-model="showTotal" color="amber" @update:model-value="updateShowTotal"/>
          </q-item-section>
        </q-item>
        <q-item-label
            header
        >
          Form
        </q-item-label>
        <q-item>
          <q-item-section>
            <q-item-label>
              <q-input v-model="input"
                       label="Enter Number (1234 3345 554)"
                       color="grey-7"
                       type="textarea"
                       :min-rows="50"/>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-virtual-scroll
          style="max-height: 40vh;"
          :items="numbers"
          separator
          v-slot="{ item, index }"
      >
        <q-item dense :key="index">
          <q-item-section avatar>
            <q-icon name="lense" color="positive"/>
          </q-item-section>
          <q-item-section>{{ item }}</q-item-section>
        </q-item>
      </q-virtual-scroll>
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
  <q-dialog v-model="localSub" no-backdrop-dismiss>
    <q-card>
      <q-card-section>
        <div class="row q-col-gutter-lg">
          <div class="col-12">
            <q-input v-model="inputSubMain"
                     @input="calculateSubstitute"
                     @blur="calculateSubstitute"
                     label="Enter Number 1234"
                     color="grey-7"/>
          </div>
          <div class="col-12">
            <q-input v-model="inputSub"
                     readonly
                     label="Result"
                     color="grey-7"
                     type="textarea"
                     :min-rows="50"/>
          </div>
          <div class="col-12">
            <div class="row q-col-gutter-lg justify-end">
              <div class="col-auto">
                <q-btn
                    color="warning"
                    @click="inputSubMain = null, inputSub = null"
                    label="Clear"
                />
              </div>
              <div class="col-auto">
                <q-btn
                    @click="copySubstituteText"
                    color="positive"
                    label="Copy">
                </q-btn>
              </div>
              <div class="col-auto">
                <q-btn
                    color="negative"
                    @click="localSub = false"
                    label="Close"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import {defineComponent, onMounted, ref, watch} from 'vue'
import {QSpinnerGears, uid, useQuasar, copyToClipboard} from 'quasar'
import jsPDF from 'jspdf'
import permutations from 'permutation'
import pad from 'pad-number'
import {db} from 'src/utils/dexie'
import {useObservable} from '@vueuse/rxjs'
import {liveQuery} from 'dexie'

import Worker from "worker-loader!../worker"

const worker = new Worker();


export default defineComponent({
  name: 'MainLayout',
  setup() {
    const $q = useQuasar()

    let digit = ref(4)
    let reverseState = ref(false)
    let showTotal = ref(true)
    let numbers = ref([])
    let mutatedNumbers = ref([])
    let comparedNumbers = ref([])

    let input = ref('')
    let localNumbers = ref([])
    let tempNumbers  = ref([])

    let inputSub = ref('')

    const delay = 800

    let liveNumbers = useObservable(
        liveQuery(async () => {
          let result = await db.numbers.toArray()
          return result.length > 0 ? JSON.parse(result[0].value) : []
        })
    )

    let liveMutatedNumbers = useObservable(
        liveQuery(async () => {
          let result = await db.mutatedNumbers.toArray()
          return result.length > 0 ? JSON.parse(result[0].value) : []
        })
    )

    watch(() => liveNumbers.value, newValue => {
      numbers.value = newValue
    }, {deep: true})

    watch(() => liveMutatedNumbers.value, newValue => {
      mutatedNumbers.value = newValue
    }, {deep: true})

    const updateDigit = async () => {
      let digitExist = await db.settings.get('digit')
      if (digitExist) {
        await db.settings.put({
          key: 'digit',
          value: digit.value
        })
      } else {
        await db.settings.add({
          key: 'digit',
          value: digit.value
        })
      }
    }

    const updateReverseState = async () => {
      let digitExist = await db.settings.get('reverseState')
      if (digitExist) {
        await db.settings.put({
          key: 'reverseState',
          value: reverseState.value
        })
      } else {
        await db.settings.add({
          key: 'reverseState',
          value: reverseState.value
        })
      }
    }

    const updateShowTotal = async () => {
      let digitExist = await db.settings.get('showTotal')
      if (digitExist) {
        await db.settings.put({
          key: 'showTotal',
          value: showTotal.value
        })
      } else {
        await db.settings.add({
          key: 'showTotal',
          value: showTotal.value
        })
      }
    }

    const updateNumbers = async (data = false) => {
      let items = data ? data : numbers.value
      items = JSON.stringify(items)
      let numbersExist = await db.numbers.get('numbers')
      if (numbersExist) {
        await db.numbers.put({
          key: 'numbers',
          value: items
        })
      } else {
        await db.numbers.add({
          key: 'numbers',
          value: items
        })
      }
    }

    const updateMutatedNumbers = async (data = false) => {
      let items = data ? data : mutatedNumbers.value
      items = JSON.stringify(items)
      let mutatedNumbersExist = await db.mutatedNumbers.get('mutatedNumbers')
      if (mutatedNumbersExist) {
        await db.mutatedNumbers.put({
          key: 'mutatedNumbers',
          value: items
        })
      } else {
        await db.mutatedNumbers.add({
          key: 'mutatedNumbers',
          value: items
        })
      }
    }

    const updateComparedNumbers = async (data = false) => {
      let items = data ? data : comparedNumbers.value
      items = JSON.stringify(items)
      let comparedNumbersExist = await db.mutatedNumbers.get('comparedNumbers')
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

    const exportToXLSX = () => {
      let data = mutatedNumbers.value.map(x => {
        return {
          'Mutations': x
        }
      })
      let opts = [{sheetid: 'One', header: true}]
      let res = alasql('SELECT * INTO XLSX("pmp.xlsx",?) FROM ?',
          [opts, [data]])
    }

    const copySubstituteText = () => {
      copyToClipboard(inputSub.value)
          .then(() => {
            $q.notify({
              message: 'Copied',
              position: 'bottom',
              type: 'positive'
            })
          })
          .catch(() => {
            $q.notify({
              message: 'Copy Failed Try Again',
              position: 'bottom',
              type: 'negative'
            })
          })
    }

    onMounted(async () => {
      let dbDigit = await db.settings.get('digit')
      if (dbDigit) {
        digit.value = dbDigit.value
      }

      let dbReverseState = await db.settings.get('reverseState')
      if (dbReverseState) {
        reverseState.value = dbReverseState.value
      }

      let dbShowTotal = await db.settings.get('showTotal')
      if (dbShowTotal) {
        showTotal.value = dbShowTotal.value
      }

      let dbNumbers = await db.numbers.get('numbers')
      if (dbNumbers) {
        numbers.value = JSON.parse(dbNumbers.value)
      }

      let dbMutatedNumbers = await db.mutatedNumbers.get('mutatedNumbers')
      if (dbMutatedNumbers) {
        mutatedNumbers.value = JSON.parse(dbMutatedNumbers.value)
      }

      let dbComparedNumbers = await db.comparedNumbers.get('comparedNumbers')
      if (dbComparedNumbers) {
        comparedNumbers.value = JSON.parse(dbComparedNumbers.value)
      }

      await updateDigit()
      await updateReverseState()
      await updateShowTotal()

      async function handleMessage(e) {
        let { mutatedNumbers, numbers } = e.data
        await updateMutatedNumbers(mutatedNumbers)
        await updateNumbers(numbers)

        localNumbers.value = []
        tempNumbers.value = []
        input.value = ''

        $q.loading.hide()
      }

      worker.addEventListener('message', handleMessage);
    })

    return {
      digit,
      numbers,
      mutatedNumbers,
      comparedNumbers,
      updateDigit,
      reverseState,
      db,
      liveNumbers,
      updateNumbers,
      updateShowTotal,
      updateReverseState,
      updateMutatedNumbers,
      updateComparedNumbers,
      liveMutatedNumbers,
      exportToXLSX,
      copySubstituteText,
      inputSub,
      showTotal,
      delay,
      localNumbers,
      tempNumbers,
      input,
    }
  },
  data() {
    return {
      toggleLeftDrawer: true,
      digitOptions: [
        {
          value: 3,
          label: '3 Digits'
        },
        {
          value: 4,
          label: '4 Digits'
        }
      ],
      inputSubMain: '',
      localSub: false,
      digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      leftDrawerOpen: this.$q.platform.desktop,
    }
  },
  methods: {
    calculateSubstitute() {
      if (this.inputSubMain !== null) {
        let subNumbers = []
        let substituteArray = []
        let tempMainDigits = []
        subNumbers = this.inputSubMain.toString().split('')
        if (subNumbers.length > 0) {
          subNumbers.forEach((n1, index1) => {
            tempMainDigits = [...subNumbers]
            this.digits.forEach((n2, index2) => {
              tempMainDigits[index1] = n1 === n2 ? parseInt(n1) : parseInt(n2)
              substituteArray.push(tempMainDigits.join(''))
            })
          })
          this.inputSub = substituteArray.join(' ')
        }
      }
    },
    async addNumber() {
      console.time('AddNumbers')
      this.$q.loading.show({
        spinner: QSpinnerGears,
        spinnerSize: 150, // in pixels
        spinnerColor: 'white',
        customClass: 'bg-negative'
      })

      await new Promise((resolve) => setTimeout(resolve,this.delay));

      this.tempNumbers = this.input.split(/\s+/)
      worker.postMessage({ tempNumbers: JSON.stringify(this.tempNumbers), length: this.digit });
      // let mutationPromise = new Promise((resolve) => {
      //   this.tempNumbers.forEach(async (x) => {
      //     if (x !== '' && x.length <= this.digit && Number(x) || x === '0000' || x === '000' || x === '00' || x === '0') {
      //       x = pad(x, this.digit)
      //       let cmb = permutations(x, {unique: true})
      //       this.numbers.push(x)
      //       this.mutatedNumbers = [...this.mutatedNumbers, ...cmb]
      //     }
      //   })
      //   resolve(true)
      // })

      // this.tempNumbers = []
      // this.localNumbers = []
      // this.input = ''
      // Promise.all([mutationPromise]).then((x) => {
      //   this.$q.loading.hide()
      // })
      console.timeEnd('AddNumbers')
    },
    async removeAllNumbers() {
      this.$q.loading.show({
        spinner: QSpinnerGears,
        spinnerSize: 150, // in pixels
        spinnerColor: 'white',
        customClass: 'bg-negative'
      })
      await new Promise((resolve) => setTimeout(resolve,this.delay));

      await db.mutatedNumbers.bulkDelete(['mutatedNumbers'])
      await db.numbers.bulkDelete(['numbers'])

      await new Promise((resolve) => setTimeout(resolve,this.delay));

      this.$q.loading.hide()
    },
  }
})
</script>
