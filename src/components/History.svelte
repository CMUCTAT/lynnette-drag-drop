<script>
  import { history } from "../stores/history";
  import ExpressionDisplay from "./display/ExpressionDisplay.svelte";
  import OperatorDisplay from "./display/OperatorDisplay.svelte";
  import TokenDisplay from "./display/TokenDisplay.svelte";
  import { Operator, Expression, Token } from "../classes.js";
  import { parseGrammar } from "../grammarParser.js";
  let ref;

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
    user-select: none; /* supported by Chrome and Opera */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
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
  <div class="stack" bind:this={ref}>
    {#each parsedHistory as item, i}
      <div class="equation-display" class:current={i === $history.index}>
        <div class="equation">
          <div class="left">
            {#if item.left instanceof Operator}
              <OperatorDisplay operator={item.left} />
            {:else if item.left instanceof Expression}
              <ExpressionDisplay expression={item.left} />
            {:else if item.left instanceof Token}
              <TokenDisplay token={item.left} />
            {/if}
          </div>
          <div class="equals">
            <div>=</div>
          </div>
          <div class="right">
            {#if item.right instanceof Operator}
              <OperatorDisplay operator={item.right} />
            {:else if item.right instanceof Expression}
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
