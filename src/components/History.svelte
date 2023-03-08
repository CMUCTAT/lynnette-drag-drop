<script>
  import { history } from "$stores/history";
  import ExpressionDisplay from "$components/ExpressionDisplay.svelte";
  import TokenDisplay from "$components/TokenDisplay.svelte";
  import { ExpressionNode, TokenNode } from "$utils/classes.js";
  import { parseGrammar } from "$utils/grammarParser.js";

  $: parsedHistory = $history.all.map(item => parseGrammar(item));
</script>

<style>
  .left {
    display: flex;
  }
  .right {
    display: flex;
  }
  .stack {
    overflow-y: auto;
    height: 100%;
  }
  .equation-display {
    user-select: none;
  }
  .equation-display .equals {
    font-size: 1em;
  }
  .equation-display.current {
    background: #388eb359;
    border-radius: 4px;
  }
  .equation {
    justify-content: center;
    display: flex;
    align-items: center;
  }
  .equals {
    display: flex;
    align-items: center;
    font-size: 1.5em;
    margin: 5px;
  }
  .equals > div {
    height: 20px;
  }
</style>

<div class="History">
  <div class="stack">
    {#each parsedHistory as item, i}
      <div class="equation-display" class:current={i === $history.index}>
        <div class="equation">
          <div class="left">
            {#if item.left instanceof ExpressionNode}
              <ExpressionDisplay expression={item.left} />
            {:else if item.left instanceof TokenNode}
              <TokenDisplay token={item.left} />
            {/if}
          </div>
          <div class="equals">
            <div>=</div>
          </div>
          <div class="right">
            {#if item.right instanceof ExpressionNode}
              <ExpressionDisplay expression={item.right} />
            {:else if item.right instanceof TokenNode}
              <TokenDisplay token={item.right} />
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
