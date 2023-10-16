<script>
  import TwitterIcon from './TwitterIcon.svelte';
</script>

<div>
  <div class="header">
    <div>
      <span role="img" aria-label="Wave"> 👋 </span>
      <h1>Wave at Nazeeh</h1>
    </div>
    <div>
      <a
        href="https://twitter.com/intent/user?screen_name=Nazeeh21"
        aria-label="Follow me on Twitter"
        title="Follow me on Twitter"
      >
        <TwitterIcon />
      </a>
    </div>
  </div>
</div>

<style>
  .header {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 20px;
    text-align: center;
    font-size: 32px;
    font-weight: 600;
  }
  .header h1 {
    display: inline-block;
    font-size: inherit;
    margin: 0;
  }
</style>