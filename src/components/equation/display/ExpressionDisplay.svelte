<script>
    import TokenDisplay from './TokenDisplay.svelte';
    import OperatorDisplay from './OperatorDisplay.svelte';
    import { Operator, Expression, Token } from '../../../stores/classes';

    export let expression;
    export let path;
    export let parentDivide;
    
    
    $: isDivide = expression.items.length > 1 && expression.items[1].equals('DIVIDE');
</script>

<div class="ExpressionDisplay"
    class:parentheses={expression.items.length > 1 && !expression.items[1].equals('DIVIDE') && path.split(",").length > 1 && !parentDivide}
    class:divide={isDivide}>
    {#each expression.items as item, i}
        {#if item instanceof Operator}
            <OperatorDisplay operator={item} path={path + "," + i}/>
        {:else if item instanceof Expression}
            <svelte:self expression={item} parentDivide={isDivide} path={path + "," + i}/>
        {:else if item instanceof Token}
            <TokenDisplay token={item} path={path + "," + i}/>
        {/if}
    {/each}
</div>

<style>
	.ExpressionDisplay {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    .ExpressionDisplay.divide {
        flex-direction: column;
    }
    .ExpressionDisplay.parentheses {
        margin: 0 4px;
        padding: 0 2px;
    }
    .ExpressionDisplay.parentheses:after {
        content: '';
        position: absolute;
        left: -4px;
        top: 0;
        bottom: 0;
        width: 4px;
        border-left: solid 2px #fff;
        border-radius: 50%;
    }
    .ExpressionDisplay.parentheses:before {
        content: '';
        position: absolute;
        right: -4px;
        top: 0;
        bottom: 0;
        width: 4px;
        border-right: solid 2px #fff;
        border-radius: 50%;
    }
</style>