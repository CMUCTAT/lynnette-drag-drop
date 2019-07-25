<script>
	export let operator;
	export let path;
</script>

<div class={"OperatorDisplay"} class:divide={operator.equals('DIVIDE')}>{operator.symbol}</div>

<style>
	.OperatorDisplay {
        text-align: center;
        vertical-align: middle;
		margin: 2px;
	}
	.OperatorDisplay.divide {
		overflow: hidden;
		height: 0;
		width: 100%;
		border-bottom: 2px solid #fff;
	}
</style>