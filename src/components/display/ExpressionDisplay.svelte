<script>
  import TokenDisplay from './TokenDisplay.svelte';
  import OperatorDisplay from './OperatorDisplay.svelte';
  import { Token, Expression } from '../../classes.js';

  export let expression;
  let isAdd = expression.node.operator === 'PLUS';
  let top = expression.items;
  let bottom = [];

  function insertOperators(items, isAdd = true) {
    if (isAdd)
      return items.reduce((a, c, i) => {
        return i === 0 ? [c] : a.concat([c.node.sign > 0 ? 'PLUS' : 'MINUS', c]);
      }, []);
    else return items.reduce((a, c, i) => (i === 0 ? [c] : a.concat(['TIMES', c])), []);
  }

  $: if (expression) {
    isAdd = expression.node.operator === 'PLUS';
    top = insertOperators(isAdd ? expression.items : expression.items.filter(item => item.node.exp > 0), isAdd);
    bottom = isAdd ? [] : insertOperators(expression.items.filter(item => item.node.exp < 0));
  }
</script>

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
  .item-display {
    display: flex;
    align-items: center;
    justify-items: center;
  }
  .divide {
    flex-direction: column;
  }
  .vinculum {
    width: 100%;
    height: 2px;
    border-radius: 2px;
    background: #333;
    margin: 5px 0;
  }
</style>

<div class="expression-display" class:divide={bottom.length > 0} class:parens={expression.parens}>
  <div class="item-display top">
    {#each top as item, i}
      {#if item instanceof Expression}
        <svelte:self expression={item} />
      {:else if item instanceof Token}
        <TokenDisplay token={item} />
      {:else}
        <OperatorDisplay operator={item} />
      {/if}
    {/each}
  </div>
  {#if bottom.length > 0}
    <div class="vinculum" />
    <div class="item-display bottom">
      {#each bottom as item, i}
        {#if item instanceof Expression}
          <svelte:self expression={item} />
        {:else if item instanceof Token}
          <TokenDisplay token={item} />
        {:else}
          <OperatorDisplay operator={item} />
        {/if}
      {/each}
    </div>
  {/if}
</div>
