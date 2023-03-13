<div class="draggable-operators">
  <DraggableOperator operator={'PLUS'}/>
  <DraggableOperator operator={'MINUS'}/>
  <DraggableOperator operator={'TIMES'}/>
  <DraggableOperator onlySymbol operator={'DIVIDE'}/>
</div>

<script>
  import DraggableOperator from '$components/DraggableOperator.svelte'
</script>

<style>
  .draggable-operators {
    grid-area: operators;
    justify-self: center;
    align-self: center;
    margin: 50px;
    border: 2px dashed #fff;
    border-radius: 5px;
    padding: 10px;
    display: flex;
    user-select: none;
  }
  @media only screen and (max-width: 820px) {
    .draggable-operators {
      margin: 0px;
      padding: 0px;
    }
  }
</style>
