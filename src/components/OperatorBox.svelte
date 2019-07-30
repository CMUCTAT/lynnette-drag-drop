<script>
    import DraggableOperator from './equation/DraggableOperator.svelte';
    export let operators;
</script>

<div class="operator-box">
    <h2>Operators</h2>
    <div class="operator-container">
        {#each operators as operator, i}
            <DraggableOperator operator={operator} path={''} hint={operator.hint} error={operator.error} />
        {/each}
    </div>
</div>

<style>
	.operator-box {
		border: dashed 2px #fff;
		display: inline-block;
		position: relative;
		padding: 15px;
		display: flex;
		border-radius: 8px;
	}
	.operator-box h2 {
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
</style>