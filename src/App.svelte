<script>
	import Operator from './components/equation/Operator.svelte';
	import Expression from './components/equation/Expression.svelte';
	import History from './components/History.svelte';
	import {draggableEqn} from './components/dragdrop/draggableEqn'
	import { history } from './stores/history.js';
	import { add, subtract, multiply, divide } from './stores/operators.js';

	let operators = [add(), subtract(), divide(), multiply()];
	let dragover = false;
	let coords = {x: 0, y: 0}
	let vel = {x: 0, y: 0}
	let split = false;

	let last_time = window.performance.now();
	let frame;

	 function lerp(value1, value2, amount) {
        amount = amount < 0 ? 0 : amount;
        amount = amount > 1 ? 1 : amount;
        return value1 + (value2 - value1) * amount;
    }

	(function update() {
		frame = requestAnimationFrame(update);

		const time = window.performance.now();
		const delta = time - last_time;
		// console.log(vel);
		
		if (vel.x + vel.y !== 0) {
			coords.x += 0.15 * vel.x * delta;
			coords.y += 0.15 * vel.y * delta;
			vel.x = lerp(vel.x, 0, 0.01 * delta);
			vel.y = lerp(vel.y, 0, 0.01 * delta);
		}

		last_time = time;
	}());
</script>

<!-- <div class="test" 
	style="transform: translate({coords.x}px,{coords.y}px)"
	use:draggableEqn
	on:dragmove={e => { coords.x = e.detail.x; coords.y = e.detail.y; }}
	on:dragend={e => {
		vel.x = e.detail.dx;
		vel.y = e.detail.dy;
		let d = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
		if (d > 20) {
			vel.x *= 20 / d;
			vel.y *= 20 / d;
		}
		}}>
	hello
</div> -->

<div class="root">
	<div class="history">
		<History></History>
	</div>
	<div class="title">
		<h1>Lynnette Drag & Drop Prototype</h1>
		<button on:click={() => split = !split} style="display: inline-block; margin: 10px;">Split Operators</button>
	</div>
	<div class="content">
		<div class="operators">
			{#if split}
			<div class="split-ops left">
				{#each operators.slice(0,2) as operator, i}
					<Operator operator={operator} path={''} />
				{/each}
			</div>
			<div class="split-ops right">
				{#each operators.slice(2) as operator, i}
					<Operator operator={operator} path={''} />
				{/each}
			</div>
			{:else}
			<div class="operator-box">
				<h2>Operators</h2>
				<div class="operator-container">
					{#each operators as operator, i}
						<Operator operator={operator} path={''} />
					{/each}
				</div>
			</div>
			{/if}
		</div>
		<div class="equation-container"
		style="transform: translate({coords.x}px,{coords.y}px)"
		use:draggableEqn
		on:dragmove={e => { coords.x = e.detail.x; coords.y = e.detail.y; }}
		on:dragend={e => {
			vel.x = e.detail.dx;
			vel.y = e.detail.dy;
			let d = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
			if (d > 20) {
				vel.x *= 20 / d;
				vel.y *= 20 / d;
			}
			}}>
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
	.split-ops {
		position: fixed;
		bottom: 20%;
	}
	.split-ops.left {
		left: 10%;
	}
	.split-ops.right {
		right: 10%;
	}
	.test {
		margin: 30px;
		padding: 20px;
		background: #ddd;
		display: inline-block;
	}
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
		display: flex;
	}
	.equation-container {
		display: flex;
		justify-content: center;
	}
	.equation {
		justify-content: center;
		display: flex;
		user-select: none;
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
</style>