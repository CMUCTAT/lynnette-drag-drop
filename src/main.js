import '$/app.css'
import App from '$/App.svelte';
import '$utils/commShellEventHandlers.js';

window.drag = {};
window.drop = {};

const searchParams = new URL(window.location).searchParams,
      templates = searchParams.get('templates'),
      style = searchParams.get('style');
if (templates) window.templates = templates;
if (style) document.documentElement.setAttribute('id', style);

const app = new App({
  target: document.getElementById('app'),
})

export default app;
