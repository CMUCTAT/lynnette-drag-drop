<script>
	import OperatorComponent from './components/equation/Operator.svelte';
	import PreviewEquation from './components/equation/PreviewEquation.svelte';
	import History from './components/History.svelte';
	import { draggableEqn } from './components/dragdrop/draggableEqn'
	import { draftEquation } from './stores/equation.js';
	import { history } from './stores/history.js';
	import { Operator, parseGrammar } from './stores/classes.js';
	let operators = [new Operator('PLUS'), new Operator('MINUS'), new Operator('TIMES'), new Operator('DIVIDE')];
</script>

<div class="root">
	<div class="history">
		<div class="buttons">
			<button on:click={() => history.step(-1)}>Undo</button>
			<button on:click={() => history.step(1)}>Redo</button>
		</div>
		<History></History>
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
						<OperatorComponent operator={operator} path={''} hint={operator.hint} error={operator.error} />
					{/each}
				</div>
			</div>
		</div>
		<div class="equation-container">
			<PreviewEquation state={parseGrammar($history.current)} draft={parseGrammar($draftEquation)}/>
		</div>
	</div>
	<!-- <div class="sidebar">
	</div> -->
</div>

<style>
	.root {
		display: grid;

		grid-template-areas: 
			"history content content"
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
	.title {
		grid-area: title;
		/* background: #0ff; */
		padding: 20px 30px;
		display: flex;
	}
	.equation-container {
		display: flex;
		justify-content: center;
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
		transform: translate(-50%, -65%);
		z-index: 1;
		margin: 0;
		padding: 0 10px;
		color: #333;
		background: #fff;
	}
	.operator-container {
		display: flex;
	}

	.equals > div {
		height: 20px;
	}
</style>