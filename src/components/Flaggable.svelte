<div class="flaggable" class:error class:hint>
  <div class="highlight"/>
  <slot/>
</div>

<script>
  export let error = false
  export let hint = false
</script>

<style>
  .flaggable {
    position: relative;
    display: flex;
  }
  .highlight {
    pointer-events: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    border-radius: 60%;
    width: 60%;
    height: 60%;
    background: #fff0;
    transition: background 0.3s ease, width 0.3s ease, height 0.3s ease;
  }
  .hint .highlight, .error .highlight {
    border-radius: 110%;
    width: 95%;
    height: 110%;
  }
  .hint .highlight {
    background: #fff04e;
  }
  .error .highlight {
    /* background: #ff3341; */
    background: #f1384d;
  }
</style>
