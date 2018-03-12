<template>
</template>
<script>
  import {
    QSpinnerGears
  } from 'quasar'
  
  export default {
    name: 'loading',
    created () {
      this.$q.loading.show({
        spinner: QSpinnerGears,
        spinnerSize: 150, // in pixels
        spinnerColor: 'white',
        customClass: 'bg-negative'
      })
      setTimeout(() => {
        this.$q.loading.hide()
        this.$router.push('/')
      }, 1500)
    }
  }
</script>