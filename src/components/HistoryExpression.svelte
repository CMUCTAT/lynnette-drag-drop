<div class="history-expression" class:divide={bottom.length > 0} class:parens={expression.node.parens}>
  <div class="history-factor">
    {#each top as item, index (item.id || item + index)}
      {#if item instanceof ExpressionNode}
        <svelte:self expression={item}/>
      {:else if item instanceof TokenNode}
        <HistoryToken token={item} isSubtract={isAdd && index > 0 && item.node.sign < 0}/>
      {:else}
        <HistoryOperator operator={item}/>
      {/if}
    {/each}
  </div>
  {#if bottom.length > 0}
    <div class="bar"/>
    <div class="history-factor">
      {#each bottom as item, index (item.id || item + index)}
        {#if item instanceof ExpressionNode}
          <svelte:self expression={item}/>
        {:else if item instanceof TokenNode}
          <HistoryToken token={item}/>
        {:else}
          <HistoryOperator operator={item}/>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<script>
  import HistoryToken from '$components/HistoryToken.svelte'
  import HistoryOperator from '$components/HistoryOperator.svelte'
  import { ExpressionNode, TokenNode } from '$utils/classes.js'

  export let expression

  let isAdd = expression.node.operator === 'PLUS',
      top = expression.items,
      bottom = []

  $: if (expression) {
    isAdd = expression.node.operator === 'PLUS'
    top = insertOperators(
      isAdd ? expression.items : expression.items.filter((item) => item.node.exp > 0),
      isAdd,
    )
    bottom = isAdd ? [] : insertOperators(expression.items.filter((item) => item.node.exp < 0))
  }

  function insertOperators(items, isAdd = true) {
    return items.reduce((array, item, index) =>
      isAdd && index === 0 ? [item] :
      isAdd ? array.concat([item.node.sign > 0 ? 'PLUS' : 'MINUS', item]) :
      index === 0 || isDistribution(item, items[index - 1]) ? array.concat(item) :
      array.concat(['TIMES', item]), []
    )
  }

  function isDistribution(item, prevItem) {
    return (item.node.parens || prevItem.node.parens) && expression.node.operator === 'TIMES'
  }
</script>

<style>
  .history-expression {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .history-expression.divide {
    flex-direction: column;
  }
  .history-expression.parens {
    margin-inline: 8px;
    padding-inline: 2px;
  }
  .history-expression.parens:before, .history-expression.parens:after {
    content: '';
    position: absolute;
    top: 0px;
    bottom: 0px;
    border-radius: 75%;
    width: 8px;
  }
  .history-expression.parens:before {
    left: -4px;
    border-left: solid 2px #333;
  }
  .history-expression.parens:after {
    right: -4px;
    border-right: solid 2px #333;
  }
  .history-factor {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .divide {
    flex-direction: column;
  }
  .bar {
    margin: 5px 0px;
    border-radius: 2px;
    width: 100%;
    height: 2px;
    background: #333;
  }
</style>
