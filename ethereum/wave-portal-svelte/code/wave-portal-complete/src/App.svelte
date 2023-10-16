<script>
  let waveList = [];
  import Header from './components/header.svelte';
  import { ethers } from 'ethers';
  import Bio from './components/Bio.svelte';
  import Wallet from './components/Wallet.svelte';
  import SendWave from './components/SendWave.svelte';
  import WaveList from './components/WaveList.svelte';
  import WavePortal from '../artifacts/contracts/Wave-Portal.sol/WavePortal.json';
  import { onMount } from 'svelte';

  const CONTRACT_ADDRESS = '0xA79784b15F463c8024Bda8e379142A70e0F13c6b';

  async function getAllWaves() {
    if (!window.ethereum) {
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const wavePortalContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      WavePortal.abi,
      provider
    );

    const recievedWaves = await wavePortalContract.getAllWaves();

    if (!recievedWaves) {
      waveList = [];
      return;
    }

    const normalizeWave = (wave) => ({
      reaction: wave.reaction,
      message: wave.message,
      waver: wave.waver,
      timestamp: new Date(wave.timestamp * 1000),
    });

    waveList = recievedWaves
      .map(normalizeWave)
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log('waveList: ', waveList);
    return;
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
