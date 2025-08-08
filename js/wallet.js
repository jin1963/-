// wallet.js  (multi-injected provider support for mobile wallets)
const { CONFIG } = window.__APP_CONFIG__;

let provider, signer, userAddress, injected;

function detectInjected() {
  // รองรับหลายกระเป๋า โดยเลือกตัวแรกที่มีอยู่จริง
  injected =
    (window.bitkeep && window.bitkeep.ethereum) || // Bitget/BitKeep mobile
    (window.okxwallet && window.okxwallet.ethereum) ||
    window.ethereum ||
    window.BinanceChain ||
    (window.trustwallet && window.trustwallet.ethereum) ||
    null;
  return injected;
}

async function ensureBSC() {
  const eth = detectInjected();
  if (!eth) throw new Error("ไม่พบกระเป๋า Web3 (ลองเปิดหน้าเว็บจากในแอป Bitget/MetaMask)");
  const net = await eth.request({ method: "eth_chainId" }).catch(() => null);

  if (net !== CONFIG.CHAIN_ID_HEX) {
    // สลับเชนไป BSC
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CONFIG.CHAIN_ID_HEX }]
    });
  }
}

async function connectWallet() {
  const eth = detectInjected();
  if (!eth) {
    alert("ไม่พบกระเป๋า Web3\nแนะนำ: เปิดหน้านี้จากในแอป Bitget/MetaMask แล้วกดเชื่อมต่ออีกครั้ง");
    throw new Error("No injected provider");
  }

  await ensureBSC();

  // บางกระเป๋าต้องขอสิทธิ์ก่อนอ่าน accounts
  await eth.request({ method: "eth_requestAccounts" });

  provider = new ethers.providers.Web3Provider(eth, "any");
  signer = provider.getSigner();
  userAddress = await signer.getAddress();

  // auto-refresh UI link
  document.getElementById("status").textContent = `✅ เชื่อมต่อแล้ว: ${userAddress}`;
  document.getElementById("scanLink").innerHTML =
    `<a href="https://bscscan.com/address/${userAddress}" target="_blank">ดู Address ของคุณบน BscScan</a>`;

  // subscribe events
  eth.on && eth.on("accountsChanged", (acc) => {
    if (acc && acc.length) {
      userAddress = acc[0];
      document.getElementById("status").textContent = `✅ เชื่อมต่อแล้ว: ${userAddress}`;
    } else {
      document.getElementById("status").textContent = "❌ ยังไม่เชื่อมต่อกระเป๋า";
    }
  });

  eth.on && eth.on("chainChanged", (cid) => {
    if (cid !== CONFIG.CHAIN_ID_HEX) {
      document.getElementById("status").textContent = "⚠️ กรุณาสลับเป็น BSC Mainnet";
    } else {
      document.getElementById("status").textContent = `✅ เชื่อมต่อแล้ว: ${userAddress}`;
    }
  });

  return userAddress;
}

function bscScanLink(addressOrTx, type="address") {
  const base = CONFIG.BSC_SCAN;
  return type === "tx" ? `${base}/tx/${addressOrTx}` : `${base}/address/${addressOrTx}`;
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
