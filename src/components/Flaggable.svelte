<script>
  export let error;
  export let hint;
  export let size;
  export let divide;
</script>

<style>
  .Flaggable {
    position: relative;
  }
  /* .Flaggable:before {
    } */
  .hint .highlight {
    background: #fff04e;
  }
  .error .highlight {
    /* background: #ff3341; */
    background: #f1384d;
  }
  .highlight {
    pointer-events: none;
    content: "";
    position: absolute;
    z-index: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 60%;
    background: #fff0;
    transition: background 0.3s ease, width 0.3s ease, height 0.3s ease;
  }
</style>

<div
  class="Flaggable"
  class:error
  class:hint
  style={divide ? 'width: 100%' : ''}>
  <div
    class="highlight"
    style={`
            border-radius: ${hint || error ? size : 60}%;
            width: ${hint || error ? size * 0.85 : 60}%;
            height: ${hint || error ? size : 60}%;
        `} />
  <slot />
</div>
