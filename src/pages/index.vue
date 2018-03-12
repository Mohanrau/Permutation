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
            <td align="center" v-for="i in 10" v-if="comparare(((i + index) - 1))">
              {{ pad(((i + index) - 1), 4) }}
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
  
  export default {
    name: 'PageIndex',
    data: () => ({
      rows: 10,
      cols: 10000,
      mutatedNumbersKey: 'mutatedNumbers',
      
    }),
    computed: {
      mutatedNumbers: {
        // getter
        get: function () {
          return this.$q.localStorage.get.item(this.mutatedNumbersKey)
        }
      }
    },
    methods: {
      pad,
      comparare (value) {
        if (this.mutatedNumbers !== null && this.mutatedNumbers.length > 0) {
          value = pad(value, 4)
          let exist = this.mutatedNumbers.find(x => x === value)
          if (typeof exist !== 'undefined') {
            return false
          } else {
            return true
          }
        }
        return true
      }
    }
  }
</script>
