<div class="draggable-operators">
  <DraggableOperator operator={'PLUS'} />
  <DraggableOperator operator={'MINUS'} />
  <DraggableOperator operator={'TIMES'} />
  <DraggableOperator onlySymbol operator={'DIVIDE'} />
</div>

<script>
  import DraggableOperator from '$components/DraggableOperator.svelte';
</script>

<style>
  .draggable-operators {
    grid-area: operators;
    margin: 50px;
    border: 2px dashed #fff;
    border-radius: 5px;
    padding: 10px;
    display: flex;
    justify-self: center;
    align-self: center;
    user-select: none;
  }
  @media only screen and (max-width: 820px) {
    .draggable-operators {
      align-self: center;
      padding: 0;
      margin: 0;
    }
  }
</style>
