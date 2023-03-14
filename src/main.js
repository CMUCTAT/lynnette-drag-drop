import '$/app.css'
import App from '$/App.svelte'
import '$utils/nativeClassExtensions.js'
import '$utils/commShellEventHandlers.js'

window.drag = {}
window.drop = {}
window.window.parse = new CTATAlgebraParser()

const searchParams = new URL(window.location).searchParams,
      templates = searchParams.get('templates'),
      style = searchParams.get('style')
if (templates) window.templates = templates
if (style) document.documentElement.setAttribute('id', style)

export default new App({ target: document.getElementById('app') })
