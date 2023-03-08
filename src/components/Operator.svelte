<script>
  import { Operators } from '$utils/classes.js';
  import { draftEquation } from '$stores/equation.js';

  export let operator;
  export let siblings = null;

  $: divide = operator === 'DIVIDE';

  function handleDoubleCLick(e) {
    draftEquation.draftOperation(siblings[0], siblings[1]);
    draftEquation.apply();
  }
</script>

<style>
  .operator {
    flex: 0;
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
  {#if !divide}{Operators[operator]}{/if}
</div>
