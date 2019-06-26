<script>
	import Draggable from './Draggable.svelte';

	$: items = ["6x", "5"];
	let error = false;
	let hint = false;
</script>
<div class="stuff">
	<div class="draggable">
		<Draggable >1</Draggable>
	</div>
	<div class="draggable">
		<Draggable error={error} hint={hint}>5x</Draggable>
	</div>
</div>
<div class="stuff">
	{#each items as item, i}
		<div class="draggable">
			<Draggable >{item}</Draggable>
		</div>
	{/each}
</div>
<div class="stuff">
	<div class="draggable">
		<Draggable >+</Draggable>
	</div>
	<div class="draggable">
		<Draggable >-</Draggable>
	</div>
	<div class="draggable">
		<Draggable >×</Draggable>
	</div>
	<div class="draggable">
		<Draggable >÷</Draggable>
	</div>
</div>
Hint: <input type=checkbox bind:checked={hint}>
Error: <input type=checkbox bind:checked={error}>

<style>
	.stuff {
		display: flex;
	}
	.draggable {
		margin: 10px;
	}
</style>