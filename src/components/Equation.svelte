<div class="equation no-highlight" class:disable={error} class:draft>
  <Flaggable error={error === 'left'}>
    {#if equation.left instanceof ExpressionNode}
      <Expression expression={equation.left}/>
    {:else if equation.left instanceof TokenNode}
      <Token token={equation.left}/>
    {/if}
  </Flaggable>
  <div class="equals">=</div>
  <Flaggable error={error === 'right'}>
    {#if equation.right instanceof ExpressionNode}
      <Expression expression={equation.right}/>
    {:else if equation.right instanceof TokenNode}
      <Token token={equation.right}/>
    {/if}
  </Flaggable>
</div>

<script>
  import Flaggable from "$components/Flaggable.svelte"
  import Expression from "$components/Expression.svelte"
  import Token from "$components//Token.svelte"
  import { TokenNode, ExpressionNode } from "$utils/classes.js"

  export let equation
  export let error = null
  export let draft = false
</script>

<style>
  .equation {
    width: min-content;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 30px;
    color: #fff;
  }
  .equation.disable {
    pointer-events: none;
  }
  .equation.draft {
    position: absolute;
    transform: translateY(-100%);
    background: rgb(10, 27, 44);
    opacity: 0.5;
    pointer-events: none;
  }
  .equals {
    padding: 10px;
  }
</style>
