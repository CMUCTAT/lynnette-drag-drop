<script>
  import { Token } from '../../classes.js';
  export let token;
  export let isSubtract = false;
</script>

<style>
  .token-display {
    text-align: center;
    vertical-align: middle;
    position: relative;
  }
  .token-display.parens {
    margin: 0 7px;
    padding: 0 2px;
  }
  .token-display.parens:after {
    content: '';
    position: absolute;
    left: -3px;
    top: 0;
    bottom: 0;
    width: 4px;
    border-left: solid 2px #333;
    border-radius: 50%;
  }
  .token-display.parens:before {
    content: '';
    position: absolute;
    right: -3px;
    top: 0;
    bottom: 0;
    width: 4px;
    border-right: solid 2px #333;
    border-radius: 50%;
  }
</style>

<div class="token-display" class:parens={token.node.parens}>
  <span class="content">{token.value(isSubtract ? -1 : 1)}</span>
</div>
