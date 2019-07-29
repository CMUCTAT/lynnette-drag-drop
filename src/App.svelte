<script>
	import OperatorComponent from './components/equation/Operator.svelte';
	import DraggableOperator from './components/equation/DraggableOperator.svelte';
	import PreviewEquation from './components/equation/PreviewEquation.svelte';
	import History from './components/History.svelte';
	import Alien from './components/Alien.svelte';
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

	let success = false;
	
</script>


		<!-- <div class="buttons">
			<button on:click={undo} class="undo" class:active={$messageManager.error}>Undo</button>
		</div>
		<div class="history-title">History</div>
		<div class="history-items">
			<History></History>
		</div> -->

<div class="root">
	<div class="testing">
		<button on:click={() => {messageManager.setError("Error"); messageManager.setSide('right')}}>Test Error</button>
		<button on:click={() => {success = !success;}}>Toggle Success</button>
		<button on:click={undo}>Undo</button>
	</div>
	<div class="sidebar">
		<div class="history">
			<div class="history-title">History</div>
			<div class="history-items">
				<History></History>
			</div> 
		</div>
		<div class="alien">
			<Alien state={success ? 'success' : $messageManager.error ? 'error' : 'default'}/>
			{#if $messageManager.error || $messageManager.hint}
				<div class="message">
					{#if $messageManager.error}
						<div class="error">{$messageManager.error.message}</div>
					{/if}
					{#if $messageManager.hint}
						<div class="hint">{$messageManager.hint.message}</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
	<div class="buttons">
		<button on:click={undo} class="button undo" class:active={$messageManager.error}>Undo</button>
		<div class="bottom">
			<button class="button button-done">Done</button>
			<button class="button button-hint">Hint</button>
		</div>
	</div>
	<div class="content">
		<div class="operators">
			<div class="operator-box">
				<h2>Operators</h2>
				<div class="operator-container">
					{#each operators as operator, i}
						<DraggableOperator operator={operator} path={''} hint={operator.hint} error={operator.error} />
					{/each}
				</div>
			</div>
		</div>
		<div class="equation-container" class:disable={$messageManager.error}>
			<PreviewEquation state={parseGrammar($history.current)} draft={parseGrammar($draftEquation)} error={$messageManager.side}/>
		</div>
	</div>
</div>

<style>
	.testing {
		position: fixed;
		bottom: 30px;
		left: 50%;
		transform: translateX(-50%);
	}
	.root {
		position: relative;
		height: 100vh;
		background: center / cover no-repeat url("./images/lynnette-sapce-bg.png")
	}
	.message {
		position: absolute;
		left: 80%;
		top: 40px;
		min-height: 60px;
		background: #fff;
		color: #333;
		border-radius: 4px;
		padding: 30px 15px 15px 15px;
		font-size: 30px;
	}
	.message:after {
		content: '';
		position: absolute;
		left: -40px;
		top: 35px;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0 40px 40px 0;
		border-color: transparent #fff transparent transparent;
	}
	.sidebar {
		position: absolute;
		z-index: 2;
		width: 250px;
		top: 0;
		bottom: 0;
		padding: 20px;
		background: center / cover no-repeat url("./images/lynnette-side-bar.png");
		display: flex;
		flex-direction: column;
	}
	.history {
		width: 60%;
		color: #333;
		flex: 1;
	}
	.buttons {
		position: absolute;
		z-index: 2;
		right: 0;
		top: 0;
		bottom: 0;
		padding: 20px;
	}
	.alien {
		/* margin-bottom: 5%; */
		position: relative;
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
		position: relative;
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
		color: #fff;
	}
	.operator-box {
		border: dashed 2px #fff;
		display: inline-block;
		position: relative;
		padding: 15px;
		display: flex;
		border-radius: 8px;
	}
	.operators h2 {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, -65%);
		z-index: 1;
		margin: 0;
		padding: 0 10px;
		background: #091a2b;
	}
	.operator-container {
		display: flex;
	}

	.equals > div {
		height: 20px;
	}
	

	@keyframes ripple {
		0% {
			opacity: 1;
			width: 100%; 
			height: 100%;
		}
		100% {
			opacity: 0;
			width: 150%; 
			height: 150%;
		}
	}
	.button-done {
		background: #dbf471;
		color: #353f615b;
	}
	.button-hint {
		background: #ffe364;
		color: #7c5f295b;
	}
	.button {
		border: none;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		margin: 20px;
		font-size: 30px;
		cursor: pointer;
	}
	.buttons .bottom {
		position: absolute;
		display: flex;
		bottom: 20px;
		right: 40px;
	}
	.undo {
		opacity: 0;
		pointer-events: none;
		font-size: 40px;
		transition: opacity 0.3s ease, box-shadow 0.3s cubic-bezier(.27,.27,.08,.96);
		position: relative;
		cursor: pointer;
		width: 150px;
		height: 150px;
		border-radius: 50%;
		background: #f1384d;
		border: none;
		color: #361b2477;
		/* border: 10px #eed836 solid; */
	}
	.undo:after {
		opacity: 0;
		content: '';
		width: 100%; 
		height: 100%;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		position: absolute;
		border: 3px solid #f1384d;
		box-sizing: border-box;
		border-radius: 50%;
		z-index: 0;
		-webkit-animation: ripple 1.5s infinite;
		-moz-animation:    ripple 1.5s infinite;
		-o-animation:      ripple 1.5s infinite;
		animation:         ripple 1.5s infinite; 
	}
	.undo.active {
		opacity: 1;
		pointer-events: all;
	}
</style>