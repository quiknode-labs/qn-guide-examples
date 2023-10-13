<script>
  export let waveList;
  import Wave from './Wave.svelte';
</script>

<div class="waveList">
  {#if waveList}
    {#each waveList as wave (wave.timestamp)}
      <Wave
        reaction={wave.reaction}
        message={wave.message}
        waver={wave.waver}
        timestamp={wave.timestamp}
      />
    {/each}
  {/if}
</div>

<style>
  .waveList {
	margin: 35px 0;
	display: flex;
	gap: 32px;
	flex-direction: column;
	animation: fadeslow 3s;
}
@keyframes fadeslow {
	0% {
		opacity: 0;
	}
	50% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}
</style>