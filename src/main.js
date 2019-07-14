import App from './App.svelte';
import './ctatloader.js';

// foo();
window.drag = {}
window.drop = {}
var app = new App({
	target: document.body
});

export default app;