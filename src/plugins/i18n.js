import VueI18n from 'vue-i18n'
import messages from 'src/i18n'
import VueClipboard from 'vue-clipboard2'

export default ({ app, Vue }) => {
  Vue.use(VueI18n)
  Vue.use(VueClipboard)
  // Set i18n instance on app
  app.i18n = new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages
  })
}
