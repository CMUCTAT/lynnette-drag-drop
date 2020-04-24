<script>
  import { afterUpdate, beforeUpdate } from "svelte";

  import { Token, Expression, Operator, DivideOperator } from "../classes.js";
  import ExpressionComponent from "./Expression.svelte";
  import OperatorComponent from "./Operator.svelte";
  import TokenComponent from "./Token.svelte";
  import DragDrop from "./DragDrop.svelte";
  import { draftEquation, dragdropData } from "../stores/equation.js";

  export let expression;
  $: divide = expression.nodes[1] instanceof DivideOperator;
</script>

<style>
  .expression {
    padding: 5px;
    display: flex;
    align-items: center;
    justify-items: center;
    box-sizing: border-box;
    border-radius: 5px;
    border: #fff0 3px solid;
    transition: all 0.25s ease;
  }
  .divide {
    flex-direction: column;
  }
  .parens:after {
    content: "";
    position: absolute;
    left: 0px;
    top: 0;
    bottom: 0;
    width: 8px;
    border-left: solid 3px #fff;
    border-radius: 50%;
  }
  .parens:before {
    content: "";
    position: absolute;
    right: 0px;
    top: 0;
    bottom: 0;
    width: 8px;
    border-right: solid 3px #fff;
    border-radius: 50%;
  }
  .hovering.dropzone {
    border: #fff 3px solid;
  }
  .draghovering.dropzone {
    border: var(--drag-highlight-color) 3px solid;
  }
</style>

<DragDrop
  let:dragging
  let:hovering
  let:draghovering
  canDrag={false}
  dropReceive={() => draftEquation.apply()}
  dragLeave={() => {
    dragdropData.setDrop(null);
  }}
  dragHover={() => {
    dragdropData.setDrop(expression);
    draftEquation.draftOperation($dragdropData.drag, $dragdropData.drop);
  }}>
  <div
    slot="dropzone"
    class="expression no-highlight dropzone"
    class:dragging
    class:hovering
    class:draghovering
    class:divide
    class:parens={expression.parens}>
    {#each expression.nodes as item, i}
      {#if item instanceof Operator}
        <OperatorComponent operator={item} siblings={expression.nodes} />
      {:else if item instanceof Expression}
        <svelte:self expression={item} />
      {:else if item instanceof Token}
        <TokenComponent token={item} />
      {/if}
    {/each}
  </div>
  <!-- <div slot="mover"></div> -->
</DragDrop>

<!-- <div class="expression no-highlight" class:divide={expression.nodes[1] instanceof DivideOperator} class:parens={expression.parens}></div> -->
