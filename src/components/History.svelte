<dev class="history">
  <h1>Steps</h1>
  <div bind:this={historyScroll} class="stack">
    {#each parsedHistory as item, index}
      <div class="equation" class:current={index === $history.index}>
        <div class="left">
          {#if item.left instanceof ExpressionNode}
            <HistoryExpression expression={item.left}/>
          {:else if item.left instanceof TokenNode}
            <HistoryToken token={item.left}/>
          {/if}
        </div>
        <div class="equals">=</div>
        <div class="right">
          {#if item.right instanceof ExpressionNode}
            <HistoryExpression expression={item.right}/>
          {:else if item.right instanceof TokenNode}
            <HistoryToken token={item.right}/>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</dev>

<script>
  import { afterUpdate } from 'svelte'
  import HistoryExpression from "$components/HistoryExpression.svelte"
  import HistoryToken from "$components/HistoryToken.svelte"
  import { history } from "$stores/history.js"
  import { ExpressionNode, TokenNode } from "$utils/classes.js"
  import { parseGrammar } from "$utils/grammarParser.js"

  let historyScroll

  $: parsedHistory = $history.all.map(item => parseGrammar(item))

  afterUpdate(() => {
    historyScroll.scrollTop = historyScroll.scrollHeight
  })
</script>

<style>
  .history {
    grid-area: steps;
    box-sizing: border-box;
    max-width: 300px;
    padding: 0px 10px;
    display: flex;
    flex-direction: column;
    text-align: center;
    font-size: 16px;
    background: #f5f4f3;
  }
  :global(#planets) .history {
    border-bottom-right-radius: 40px;
  }
  .stack {
    margin-bottom: 40px;
    flex: 1;
    overflow: auto;
  }
  .equation {
    margin-block: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
  }
  .equation.current {
    border-radius: 4px;
    background: #388eb359;
  }
  .left {
    display: flex;
  }
  .right {
    display: flex;
  }
  .equals {
    margin-inline: 2px;
    display: flex;
    align-items: center;
    font-size: 1em;
  }
</style>
