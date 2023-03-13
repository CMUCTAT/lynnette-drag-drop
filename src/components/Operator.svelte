<div class="operator no-highlight" class:divide on:dblclick={handleDoubleClick}>
  {#if !divide}{Operators[operator]}{/if}
</div>

<script>
  import { Operators } from '$utils/classes.js'
  import { draftEquation } from '$stores/equation.js'

  export let operator
  export let siblings = null

  $: divide = operator === 'DIVIDE'

  function handleDoubleClick(event) {
    draftEquation.draftOperation(siblings[0], siblings[1])
    draftEquation.apply()
  }
</script>

<style>
  .operator {
    border-radius: 20px;
    flex: auto;
    padding: 10px;
    color: #fff;
  }
  @media only screen and (max-width: 820px) {
    .operator {
      padding-inline: 5px;
    }
  }
  .divide {
    margin: 4px;
    border-radius: 2px;
    width: 100%;
    height: 2px;
    padding: 0px;
    background: #fff;
  }
</style>
