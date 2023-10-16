<script>
  let waveList = [];
  import Header from './components/Header.svelte';
  import Bio from './components/Bio.svelte';
  import Wallet from './components/Wallet.svelte';
  import SendWave from './components/SendWave.svelte';
  import WaveList from './components/WaveList.svelte';
  import { onMount } from 'svelte';
  
	const CONTRACT_ADDRESS = 'YOUR_CONTACT_ADDRESS';
  
	async function getAllWaves() {

  }

  onMount(getAllWaves);
</script>

<main>
  <Header />
  <Bio />
  <Wallet />
  <SendWave {CONTRACT_ADDRESS} fetchWaves={getAllWaves} />
  <WaveList {waveList} />
</main>

<style>
</style>