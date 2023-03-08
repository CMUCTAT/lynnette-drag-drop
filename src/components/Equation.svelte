<script>
  import { TokenNode, ExpressionNode } from "$utils/classes.js";
  import Expression from "$components/Expression.svelte";
  import Token from "$components//Token.svelte";
  import Flaggable from "$components/Flaggable.svelte";

  export let equation;
  export let error = null;
</script>

<style>
  .equation {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 30px;
  }
  .side {
    display: flex;
  }
  .no-exp {
    padding: 5px;
  }
</style>

<div class="equation no-highlight">

  <Flaggable error={error === 'left'} size={110}>
    <div
      class="side left"
      class:no-exp={!(equation.right instanceof ExpressionNode)}>
      {#if equation.left instanceof ExpressionNode}
        <Expression expression={equation.left} />
      {:else if equation.left instanceof TokenNode}
        <Token token={equation.left} />
      {/if}
    </div>
  </Flaggable>
  <span class="equals">=</span>
  <Flaggable error={error === 'right'} size={110}>
    <div
      class="side right"
      class:no-exp={!(equation.right instanceof ExpressionNode)}>
      {#if equation.right instanceof ExpressionNode}
        <Expression expression={equation.right} />
      {:else if equation.right instanceof TokenNode}
        <Token token={equation.right} />
      {/if}
    </div>
  </Flaggable>
</div>
