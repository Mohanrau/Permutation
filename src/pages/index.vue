<template>
  <q-page class="flex flex-center">
    <div id="pdf"></div>
    <div class="q-ma-lg fit">
      <table id="pdf-table" class="q-table-html bordered cell-separator fit">
        <thead>
        <tr>
          <th align="center" v-for="i in 10">#{{ i }}#</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="(col, index) in cols">
          <tr v-if="(index % rows == 0)">
            <td align="center" v-for="i in 10" v-if="compare(((i + index) - 1))">
              {{ pad(((i + index) - 1), digit) }}
            </td>
            <td align="center" v-else=""> -</td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </q-page>
</template>

<style>
</style>

<script>
  import pad from 'pad-number'
  import padRight from 'pad-right'
  export default {
    name: 'PageIndex',
    data: () => ({
      rows: 10,
      cols: this.digit === 4 ? 100000 : 1000,
      mutatedNumbersKey: 'mutatedNumbers',
    }),
    computed: {
      digit: {
        get: function () {
          return this.localStorage.digit !== null ? this.localStorage.digit : 3
        }
      },
      mutatedNumbers: {
        get: function () {
          return this.localStorage.mutatedNumbers !== null ? this.localStorage.mutatedNumbers : []
        }
      },
      reverseState: {
        get: function () {
          return this.localStorage.reverseState !== null ? this.localStorage.reverseState : false
        }
      }
    },
    methods: {
      pad,
      padRight,
      compare (value) {
        if (this.mutatedNumbers !== null && this.mutatedNumbers.length > 0) {
          value = pad(value, this.digit)
          let exist = this.mutatedNumbers.find(x => x === value)
          if (typeof exist !== 'undefined') {
            return this.reverseState ? true : false
          } else {
            return this.reverseState ? false : true
          }
        }
        return true
      }
    }
  }
</script>
