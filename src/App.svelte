<script>
	import Operator from './components/equation/Operator.svelte';
	import Expression from './components/equation/Expression.svelte';
	import { history } from './stores/history.js';
	import { add, subtract, multiply, divide } from './stores/operators.js';

	let operators = [add(), subtract(), divide(), multiply()];
	let dragover = false;
</script>

<div class="root">
	<div class="history">
	</div>
	<div class="title">
		<h1>Lynnette Drag & Drop Prototype</h1>
	</div>
	<div class="content">
		<div class="operators">
			<div class="operator-box">
				<h2>Operators</h2>
				<div class="operator-container">
					{#each operators as operator, i}
						<Operator operator={operator} path={''} />
					{/each}
				</div>
			</div>
		</div>
		<div class="equation-container">
			<div class="equation" on:dragover={e => { dragover = true; e.stopPropagation(); }}>
				<Expression expression={$history.current.left} path={"left"} parentDivide={false}/>
				<div class="equals"><div>=</div></div>
				<Expression expression={$history.current.right} path={"right"} parentDivide={false}/>
			</div>
		</div>
	</div>
	<div class="sidebar"></div>
</div>

<style>
	.root {
		display: grid;

		grid-template-areas: 
			"history content sidebar"
			"title title title";
		grid-template-columns: 200px auto 200px;
		grid-template-rows: calc(100vh - 120px) 120px;
		height: 100vh;
	}
	.history {
		grid-area: history;
		padding: 20px;
	}
	.content {
		padding: 40px 0;
		grid-area: content;
		/* background: #0f0; */
	}
	.sidebar {
		grid-area: sidebar;
		/* background: #00f; */
	}
	.title {
		grid-area: title;
		/* background: #0ff; */
		padding: 20px 30px;
	}
	.equation-container {
		display: flex;
		justify-content: center;
	}
	.equation {
		justify-content: center;
		display: flex;
	}
	.buttons {
		display: flex;
		justify-content: center;
		padding: 5px;
	}
	.operators {
		display: flex;
		justify-content: center;
		padding: 5px;
	}
	.operator-box {
		border: dashed 2px #333;
		display: inline-block;
		position: relative;
		padding: 15px;
		display: flex;
	}
	.operators h2 {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, -60%);
		z-index: 1;
		margin: 0;
		padding: 0 10px;
		color: #333;
		background: #fff;
	}
	.operator-container {
		display: flex;
	}
	.equals {
		display: flex;
		align-items: center;
		font-size: 1.5em;
		line-height: 15px;
		margin: 5px;
	}

	.equals > div {
		height: 20px;
	}
	.draft {
		position: relative;
		opacity: 0.3;
	}
	.draft:before {
		content: '';
		width: 0; 
		height: 0; 
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 8px solid #444;
		position: absolute;
		left: 50%;
		transform: translate(-50%);
		top: -4px;
	}
	.stack {
		overflow-y: auto;
		height: 100%;
	}
	.equation-display {
		user-select: none;
	}
	.equation-display .equals {
		font-size: 1em;
	}
	.equation-display.current {
		background: #388eb359;
		border-radius: 4px;
	}
</style>