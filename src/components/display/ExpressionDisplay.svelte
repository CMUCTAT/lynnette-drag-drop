<script>
    import TokenDisplay from './TokenDisplay.svelte';
    import OperatorDisplay from './OperatorDisplay.svelte';
    import { Token, Expression, Operator, DivideOperator } from '../../classes.js';

    export let expression;
</script>

<div class="expression-display" class:divide={expression.nodes[1] instanceof DivideOperator} class:parens={expression.parens}>
    {#each expression.nodes as item, i}
        {#if item instanceof Operator}
            <OperatorDisplay operator={item} />
        {:else if item instanceof Expression}
            <svelte:self expression={item} />
        {:else if item instanceof Token}
            <TokenDisplay token={item} />
        {/if}
    {/each}
</div>

<style>
	.expression-display {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    .expression-display.divide {
        flex-direction: column;
    }
    .expression-display.parens {
        margin: 0 4px;
        padding: 0 2px;
    }
    .expression-display.parens:after {
        content: '';
        position: absolute;
        left: -4px;
        top: 0;
        bottom: 0;
        width: 4px;
        border-left: solid 2px #333;
        border-radius: 50%;
    }
    .expression-display.parens:before {
        content: '';
        position: absolute;
        right: -4px;
        top: 0;
        bottom: 0;
        width: 4px;
        border-right: solid 2px #333;
        border-radius: 50%;
    }
</style>