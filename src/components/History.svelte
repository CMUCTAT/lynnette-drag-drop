<script>
	import { history } from '../stores/history.js';
	import ExpressionDisplay from './equation/display/ExpressionDisplay.svelte';
    let ref;
</script>

<div class="History">
    <div class="stack" bind:this={ref}>
			{#each $history.all as item, i}
				<div class="equation-display" class:current={i===$history.index} on:click={() => history.goTo(i)}>
					<div class="equation">
						<ExpressionDisplay expression={item.left} parentDivide={false} path={"left"}/>
						<div class="equals"><div>=</div></div>
						<ExpressionDisplay expression={item.right} parentDivide={false} path={"right"}/>
					</div>
				</div>
			{/each}
		</div>
</div>

<style>
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
	.equation {
		justify-content: center;
		display: flex;
	}
	.equals {
		display: flex;
		align-items: center;
		font-size: 1.5em;
		margin: 5px;
	}

	.equals > div {
		height: 20px;
	}
</style>