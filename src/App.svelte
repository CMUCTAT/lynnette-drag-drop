<script>
	import OperatorComponent from './components/equation/Operator.svelte';
	import PreviewEquation from './components/equation/PreviewEquation.svelte';
	import History from './components/History.svelte';
	import { draggableEqn } from './components/dragdrop/draggableEqn'
	import { draftEquation } from './stores/equation.js';
	import { history } from './stores/history.js';
	import { Operator } from './stores/classes';
	import { parseGrammar } from './stores/equation';
	import { messageManager } from './stores/messageManager';
	let operators = [new Operator('PLUS'), new Operator('MINUS'), new Operator('TIMES'), new Operator('DIVIDE')];

	function undo() {
		history.step(-1);
		messageManager.reset();
	}
	
</script>

<div class="root">
	<div class="history">
		<div class="buttons">
			<button on:click={undo} class="undo" class:active={$messageManager.error}>Undo</button>
			<!-- <button on:click={() => history.step(1)}>Redo</button> -->
		</div>
		<div class="history-title">History</div>
		<div class="history-items">
			<History></History>
		</div>
	</div>
	<!-- <div class="title">
		<h1>Lynnette Drag & Drop Prototype</h1>
	</div> -->
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
		<div class="equation-container" class:disable={$messageManager.error}>
			<PreviewEquation state={parseGrammar($history.current)} draft={parseGrammar($draftEquation)} error={$messageManager.side}/>
		</div>
	</div>
	<div class="message">
		<button on:click={() => {messageManager.setError("Error"); messageManager.setSide('right')}}>Test Error</button>
		{#if $messageManager.error}
			<div class="error">{$messageManager.error.message}</div>
		{/if}
		{#if $messageManager.hint}
			<div class="hint">{$messageManager.hint.message}</div>
		{/if}
	</div>
	<!-- <div class="sidebar">
	</div> -->
</div>

<style>
	.root {
		display: grid;

		grid-template-areas: 
			"history content content"
			"title message message";
		grid-template-columns: 200px auto 200px;
		grid-template-rows: 70% 30%;
		height: 100vh;
	}
	.message {
		grid-area: message;
	}
	.history {
		grid-area: history;
		padding: 20px;
	}
	.history-items {
		border-top: 2px #333 solid;
	}
	.history-title {
		text-align: center;
	}
	.content {
		padding: 40px 0;
		grid-area: content;
		/* background: #0f0; */
	}
	.equation-container {
		display: flex;
		justify-content: center;
	}
	.equation-container.disable {
		pointer-events: none;
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
	.message {
		background: #eee;
		border-radius: 4px;
		padding: 15px;
	}
	.undo {
		font-size: 30px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s ease, box-shadow 0.3s cubic-bezier(.27,.27,.08,.96);
		position: relative;
		cursor: pointer;
		/* border: 10px #eed836 solid; */
	}
	.undo:after {
		content: '';
		width: 0; 
		height: 0; 
		border-top: 10px solid transparent;
		border-bottom: 10px solid transparent;
		border-left: 10px solid #333;
		position: absolute;
		left: -25px;
		top: calc(50% - 10px);
		-webkit-animation: indicator-left 1.5s infinite;
		-moz-animation:    indicator-left 1.5s infinite;
		-o-animation:      indicator-left 1.5s infinite;
		animation:         indicator-left 1.5s infinite; 
	}
	.undo:before {
		content: '';
		width: 0; 
		height: 0; 
		border-top: 10px solid transparent;
		border-bottom: 10px solid transparent;
		border-right: 10px solid #333;
		position: absolute;
		right: -25px;
		top: calc(50% - 10px);
		-webkit-animation: indicator-right 1.5s infinite;
		-moz-animation:    indicator-right 1.5s infinite;
		-o-animation:      indicator-right 1.5s infinite;
		animation:         indicator-right 1.5s infinite; 
	}
	.undo.active {
		/* box-shadow: #ff3341 0 0 0px 10px; */
		opacity: 1;
		pointer-events: all;
	}
	.buttons {
		display: flex;
		justify-content: center;
		padding: 5px;
	}

	@keyframes indicator-left {
		0%   { left: -25px; }
		50%   { left: -40px; }
		100% { left: -25px; }
	}
	@keyframes indicator-right {
		0%   { right: -25px; }
		50%   { right: -40px; }
		100% { right: -25px; }
	}
</style>