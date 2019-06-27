<script>
    import { history } from '../stores/history.js'
    let ref;
</script>

<div class="History">
    <div class="stack" bind:this={ref}>
			{#each $history.all as item, i}
				<div class="equation-display" class:current={i===$history.index} on:click={() => history.goTo(i)}>
					<div class="equation">
						<ExpressionDisplay expression={item.left} parentDivide={false} path={"left"}/>
						<div class="equals"><span>=</span></div>
						<ExpressionDisplay expression={item.right} parentDivide={false} path={"right"}/>
					</div>
				</div>
			{/each}
		</div>
</div>

<style>

</style>