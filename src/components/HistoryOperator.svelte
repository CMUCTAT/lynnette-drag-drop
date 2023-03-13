<div class="history-operator" class:divide={isDivide}>
  {#if !isDivide}{Operators[operator]}{/if}
</div>

<script>
  import { Operators } from "$utils/classes.js"

  export let operator

  let isDivide = operator === "DIVIDE"
</script>

<style>
  .history-operator {
    margin: 2px;
    text-align: center;
  }
  .history-operator.divide {
    border-bottom: 2px solid #333;
    width: 100%;
    height: 0px;
    overflow: hidden;
  }
</style>
