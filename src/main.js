import App from './App.svelte';
// import './base.js';
// import './ctat.min.js';

// const a = goog.require('CTATConfig')
// console.log(a);

// import "./ctat.full.js";
// import CTATExampleTracer from "./ctat.full.js";
// import CTATExampleTracer from "./ctat.full.js";
// console.log(CTATExampleTracer);
// import {CTATAlgebraParser} from "./ctat.full.js";
// console.log(CTATAlgebraParser);

// import CTATExampleTracer from './ctat.full.js';\
// const a = new CTATExampleTracer()
// console.log(a);
window.drag = {}
window.drop = {}
var app = new App({
	target: document.body
});

export default app;