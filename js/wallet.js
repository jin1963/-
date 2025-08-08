const { CONFIG } = window.__APP_CONFIG__;

let provider, signer, userAddress;

async function ensureBSC() {
  const eth = window.ethereum;
  if (!eth) throw new Error("ไม่พบกระเป๋า Web3 (MetaMask/Bitget)");

  const net = await eth.request({ method: "eth_chainId" });
  if (net !== CONFIG.CHAIN_ID_HEX) {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CONFIG.CHAIN_ID_HEX }]
    });
  }
}

async function connectWallet() {
  await ensureBSC();
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  return userAddress;
}

function bscScanLink(addressOrTx, type="address") {
  const base = CONFIG.BSC_SCAN;
  return type === "tx"
    ? `${base}/tx/${addressOrTx}`
    : `${base}/address/${addressOrTx}`;
}

async function initUI() {
  document.getElementById("contractAddr").textContent = CONFIG.AUTO_STAKER;
  document.getElementById("btnConnect").onclick = async () => {
    try {
      const addr = await connectWallet();
      document.getElementById("status").textContent = `✅ เชื่อมต่อแล้ว: ${addr}`;
      document.getElementById("scanLink").innerHTML =
        `<a href="${bscScanLink(addr)}" target="_blank">ดู Address ของคุณบน BscScan</a>`;
    } catch (e) {
      alert(e.message || e);
    }
  };
}

window.addEventListener("load", initUI);
