<script>
  import { Operators } from "../../classes.js";
  export let operator;
  let isDivide = operator === "DIVIDE";
</script>

<style>
  .operator-display {
    text-align: center;
    vertical-align: middle;
    margin: 2px;
  }
  .operator-display.divide {
    overflow: hidden;
    height: 0;
    width: 100%;
    border-bottom: 2px solid #333;
  }
</style>

<div class="operator-display" class:divide={isDivide}>
  {#if !isDivide}{Operators[operator]}{/if}
</div>
