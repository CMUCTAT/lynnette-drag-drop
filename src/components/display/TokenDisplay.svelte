<script>
  import { Token } from "../../classes.js";
  export let token;
</script>

<style>
  .token-display {
    text-align: center;
    vertical-align: middle;
  }
</style>

<div class="token-display">
  <span class="content">{token.value()}</span>
</div>
