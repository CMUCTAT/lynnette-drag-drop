<script>
  import { DivideOperator } from "../classes.js";
  import { draftEquation } from "../stores/equation.js";

  export let operator;
  export let siblings = null;

  $: divide = operator instanceof DivideOperator;

  function handleDoubleCLick(e) {
    console.log(siblings);
    let index = siblings.indexOf(operator);
    console.log(index);

    draftEquation.draftOperation(siblings[index - 1], siblings[index + 1]);
    draftEquation.apply();
  }
</script>

<style>
  .operator {
    padding: 20px;
    border-radius: 20px;
    color: #fff;
    display: inline-block;
    /* pointer-events: none; */
  }
  .divide {
    padding: 0;
    margin: 4px;
    width: 100%;
    height: 2px;
    background: #fff;
    border-radius: 2px;
  }
</style>

<div class="operator no-highlight" class:divide on:dblclick={handleDoubleCLick}>
  {#if !divide}{operator.symbol}{/if}
</div>
