<script>
  import { Token, Expression } from "../classes.js";
  import ExpressionComponent from "./Expression.svelte";
  import OperatorComponent from "./Operator.svelte";
  import TokenComponent from "./Token.svelte";
  import Flaggable from "./Flaggable.svelte";

  export let equation;
  export let error = null;
</script>

<style>
  .equation {
    display: inline-flex;
    align-items: center;
    justify-items: center;
    color: #fff;
    font-size: 30px;
  }
  .side {
    display: flex;
  }
  .equals {
    /* font-size: 30px; */
  }
  .no-exp {
    padding: 5px;
  }
</style>

<div class="equation no-highlight">

  <Flaggable error={error === 'left'} size={110}>
    <div
      class="side left"
      class:no-exp={!(equation.right instanceof Expression)}>
      {#if equation.left instanceof Expression}
        <ExpressionComponent expression={equation.left} />
      {:else if equation.left instanceof Token}
        <TokenComponent token={equation.left} />
      {/if}
    </div>
  </Flaggable>
  <span class="equals">=</span>
  <Flaggable error={error === 'right'} size={110}>
    <div
      class="side right"
      class:no-exp={!(equation.right instanceof Expression)}>
      {#if equation.right instanceof Expression}
        <ExpressionComponent expression={equation.right} />
      {:else if equation.right instanceof Token}
        <TokenComponent token={equation.right} />
      {/if}
    </div>
  </Flaggable>
</div>
