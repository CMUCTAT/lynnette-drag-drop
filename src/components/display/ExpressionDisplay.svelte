<script>
  import TokenDisplay from "./TokenDisplay.svelte";
  import OperatorDisplay from "./OperatorDisplay.svelte";
  import { Token, Expression } from "../../classes.js";

  export let expression;
  let isAdd = expression.node.operator === "PLUS";

  let top = isAdd
    ? expression.items
    : expression.items.filter(item => item.node.exp > 0);
  top = top.reduce(
    (acc, cur, i) =>
      acc.concat(i < top.length - 1 ? [cur, isAdd ? "PLUS" : "TIMES"] : [cur]),
    []
  );
  let bottom = isAdd ? [] : expression.items.filter(item => item.node.exp < 0);
  bottom = bottom.reduce(
    (acc, cur, i) =>
      acc.concat(
        i < bottom.length - 1 ? [cur, isAdd ? "PLUS" : "TIMES"] : [cur]
      ),
    []
  );
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
    content: "";
    position: absolute;
    left: -4px;
    top: 0;
    bottom: 0;
    width: 4px;
    border-left: solid 2px #333;
    border-radius: 50%;
  }
  .expression-display.parens:before {
    content: "";
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

<div
  class="expression-display"
  class:divide={bottom.length > 0}
  class:parens={expression.parens}>
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
