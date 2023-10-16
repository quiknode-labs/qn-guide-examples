<script>
  import { ethers } from 'ethers';
  let account;
  let connectWalletError;
  let walletConnected = false;
  async function connectWallet() {
    walletConnected = false;
    const { ethereum } = window;
    console.log('ethereum: ', ethereum);
    console.log('Connecting wallet');
    await ethereum
      .request({ method: 'eth_requestAccounts' })
      .then((accountList) => {
        const [firstAccount] = accountList;
        account = firstAccount;
        walletConnected = true;
        console.log('wallet connected');
        console.log(account);
      })
      .catch((error) => {
        walletConnected = false;
        connectWalletError = error;
        console.log('error connecting wallet');
      });
  }
</script>

<div class="walletButtonGroup justifyCenter">
  

  {#if walletConnected}
    <div>
      <span class="dotConnected" />
      Connected Account: {account}
    </div>
    {:else} 
    <button class="button buttonMetaMask" on:click={connectWallet}>
      Connect MetaMask
    </button>
  {/if}

  <div class="network">
    After connecting MetaMask, please switch to Sepolia testnet.
  </div>
</div>

<style>
  .walletButtonGroup {
    margin: 10px 0;
    min-height: 46px;
    /* display: flex; */
    gap: 20px;
    /* flex-direction: row; */
    align-items: center;
    justify-content: space-between;
  }

  .justifyCenter {
    justify-content: center;
    text-align: center;
  }

  .network {
    margin: 2.5vh 0;
  }

  .buttonMetaMask {
    --button-bg-color: #f6851b;
  }

  .dotConnected {
    display: inline-block;
    margin: 1px 10px;
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background-color: #34d399;
  }

  @media screen and (min-width: 768px) {
    .walletButtonGroup {
      flex-direction: row;
    }
  }
</style>
