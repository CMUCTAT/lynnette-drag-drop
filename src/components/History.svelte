<script>
  import { history } from "../stores/history";
  import ExpressionDisplay from "./display/ExpressionDisplay.svelte";
  import TokenDisplay from "./display/TokenDisplay.svelte";
  import { Expression, Token } from "../classes.js";
  import { parseGrammar } from "../grammarParser.js";

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
            {#if item.left instanceof Expression}
              <ExpressionDisplay expression={item.left} />
            {:else if item.left instanceof Token}
              <TokenDisplay token={item.left} />
            {/if}
          </div>
          <div class="equals">
            <div>=</div>
          </div>
          <div class="right">
            {#if item.right instanceof Expression}
              <ExpressionDisplay expression={item.right} />
            {:else if item.right instanceof Token}
              <TokenDisplay token={item.right} />
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
