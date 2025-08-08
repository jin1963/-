let web3;
let account;
let usdt, staker, router;

async function connectWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await web3.eth.getChainId();
      if (chainId !== parseInt(CONFIG.chainId, 16)) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CONFIG.chainId }]
        });
      }
      const accounts = await web3.eth.getAccounts();
      account = accounts[0];
      document.getElementById("status").innerText = `✅ เชื่อมต่อแล้ว: ${account}`;
      initContracts();
    } catch (err) {
      alert("เชื่อมต่อกระเป๋าไม่สำเร็จ: " + err.message);
    }
  } else {
    alert("กรุณาติดตั้ง MetaMask หรือเปิดจาก Bitget Wallet");
  }
}

function initContracts() {
  usdt = new web3.eth.Contract(ERC20_ABI, CONFIG.usdt);
  staker = new web3.eth.Contract(AUTO_STAKER_ABI, CONFIG.autoStaker);
  router = new web3.eth.Contract(ROUTER_ABI, CONFIG.router);
}
