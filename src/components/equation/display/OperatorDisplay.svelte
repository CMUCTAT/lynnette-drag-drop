<script>
    import { divide } from '../../../stores/operators'
	
	export let operator;
	export let path;
</script>

<div class={"OperatorDisplay"} class:divide={operator.equals(divide())}>{operator.symbol}</div>

<style>
	.OperatorDisplay {
        cursor: pointer;
        text-align: center;
        vertical-align: middle;
		margin: 2px;
	}
	.OperatorDisplay.divide {
		overflow: hidden;
		height: 0;
		width: 100%;
		border-bottom: 2px solid #333;
	}
</style>