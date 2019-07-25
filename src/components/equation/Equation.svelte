<script>
    import { Operator, Expression, Token } from '../../stores/classes.js';
	import ExpressionComponent from './Expression.svelte';
	import OperatorComponent from './Operator.svelte';
    import TokenComponent from './Token.svelte';

    
    export let state;
    export let error;
    
</script>

<div class="equation">
    <div class="left">
        {#if state.left instanceof Operator}
            <OperatorComponent operator={state.left} path={"left"} hint={state.left.hint} error={error === 'left'} />
        {:else if state.left instanceof Expression}
            <ExpressionComponent expression={state.left} path={"left"} parentDivide={false} hint={state.left.hint} error={error === 'left'} />
        {:else if state.left instanceof Token}
            <div class="padding"><TokenComponent token={state.left} path={"left"} hint={state.left.hint} error={error === 'left'} /></div>
        {/if}
    </div>
    <div class="equals">=</div>
    <div class="right">
        {#if state.right instanceof Operator}
            <OperatorComponent operator={state.right} path={"right"} hint={state.right.hint} error={error === 'right'} />
        {:else if state.right instanceof Expression}
            <ExpressionComponent expression={state.right} path={"right"} parentDivide={false} hint={state.right.hint} error={error === 'right'} />
        {:else if state.right instanceof Token}
            <div class="padding"><TokenComponent token={state.right} path={"right"} hint={state.right.hint} error={error === 'right'} /></div>
        {/if}
    </div>
</div>

<style>
	.equals {
		font-size: 1.5em;
		margin: 5px;
        height: 30px;
        line-height: 25px;
	}
	.equation {
		align-items: center;
		display: flex;
		user-select: none;
		touch-action: none;
    }
    .padding {
        padding: 23px;
    }
</style>