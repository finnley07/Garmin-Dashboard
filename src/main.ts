import { createApp } from 'vue'
import App from './App.vue'
import { createI18nPlugin } from './i18n'
import { installFontAwesome } from './plugins/fontawesome'
import { applyChartPerformanceDefaults } from './plugins/chartDefaults'
import './styles/theme.css'

applyChartPerformanceDefaults()

const app = createApp(App)
installFontAwesome(app)
app.use(createI18nPlugin()).mount('#app')
