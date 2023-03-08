import '$/app.css'
import App from '$/App.svelte';
import '$utils/commShellEventHandlers.js';

window.drag = {};
window.drop = {};

const app = new App({
  target: document.getElementById('app'),
})

export default app;
