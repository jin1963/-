// wallet.js — ultra-compat mobile wallet picker (Bitget/BitKeep friendly)
const { CONFIG } = window.__APP_CONFIG__;

let provider, signer, userAddress;

function pickInjected() {
  // 1) ตัวที่เจาะจงก่อน
  if (window.bitget && window.bitget.ethereum) return window.bitget.ethereum;   // บางเวอร์ชัน
  if (window.bitkeep && window.bitkeep.ethereum) return window.bitkeep.ethereum; // ส่วนใหญ่ของ Bitget/BitKeep
  if (window.okxwallet && window.okxwallet.ethereum) return window.okxwallet.ethereum;
  if (window.trustwallet && window.trustwallet.ethereum) return window.trustwallet.ethereum;
  if (window.BinanceChain) return window.BinanceChain;

  // 2) ethereum หลายตัว (เช่น MetaMask + Bitget) จะอยู่ใน ethereum.providers
  if (window.ethereum && Array.isArray(window.ethereum.providers)) {
    // เลือก BitKeep/Bitget ก่อน ตามด้วย MetaMask
    const list = window.ethereum.providers;
    const pick =
      list.find(p => p.isBitKeep || p.isBitget) ||
      list.find(p => p.isMetaMask) ||
      list[0];
    if (pick) return pick;
  }

  // 3) ตัวปกติ
  if (window.ethereum) return window.ethereum;

  return null;
}

async function ensureBSC(eth) {
  // บาง wallet ไม่รองรับ eth_chainId — ใส่ try/catch ไว้
  let net = null;
  try { net = await eth.request({ method: "eth_chainId" }); } catch(e) {}
  if (net !== CONFIG.CHAIN_ID_HEX) {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CONFIG.CHAIN_ID_HEX }]
    }).catch(async (err) => {
      // ถ้าไม่มี chain ให้เพิ่ม
      if (err && err.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CONFIG.CHAIN_ID_HEX,
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed1.binance.org"],
            blockExplorerUrls: ["https://bscscan.com"]
          }]
        });
      } else {
        throw err;
      }
    });
  }
}

async function connectWallet() {
  let eth = pickInjected();
  if (!eth) {
    alert("ไม่พบกระเป๋าในหน้านี้\n➡️ โปรดเปิดหน้านี้จาก In-App Browser ของ Bitget/MetaMask แล้วลองใหม่");
    throw new Error("No injected provider");
  }

  // บาง wallet ต้องตั้ง selectedProvider ด้วยตนเอง (กรณี ethereum.providers)
  if (window.ethereum && window.ethereum.setSelectedProvider && eth !== window.ethereum) {
    try { window.ethereum.setSelectedProvider(eth); } catch(e) {}
  }

  // ขอสิทธิ์บัญชี + สลับเชน
  await eth.request({ method: "eth_requestAccounts" });
  await ensureBSC(eth);

  provider = new ethers.providers.Web3Provider(eth, "any");
  signer   = provider.getSigner();
  userAddress = await signer.getAddress();

  // UI
  document.getElementById("status").textContent = `✅ เชื่อมต่อแล้ว: ${userAddress}`;
  document.getElementById("scanLink").innerHTML =
    `<a href="https://bscscan.com/address/${userAddress}" target="_blank">ดู Address ของคุณบน BscScan</a>`;

  // events
  if (eth.on) {
    eth.on("accountsChanged", async (acc) => {
      if (acc && acc.length) {
        userAddress = acc[0];
        document.getElementById("status").textContent = `✅ เชื่อมต่อแล้ว: ${userAddress}`;
      } else {
        document.getElementById("status").textContent = "❌ ยังไม่เชื่อมต่อกระเป๋า";
      }
    });
    eth.on("chainChanged", async (cid) => {
      if (cid !== CONFIG.CHAIN_ID_HEX) {
        document.getElementById("status").textContent = "⚠️ กรุณาสลับเป็น BSC Mainnet";
      } else {
        document.getElementById("status").textContent = `✅ เชื่อมต่อแล้ว: ${userAddress}`;
      }
    });
  }

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

  // แสดงปุ่มเปิดผ่าน Bitget Deep Link เผื่อเปิดจาก Safari/Chrome
  // เพิ่มปุ่มนี้ไว้ในหน้าได้หากต้องการ
  // document.getElementById("scanLink").innerHTML =
  //   `<a href="bitkeep://dapp?url=${encodeURIComponent(location.href)}">เปิดหน้านี้ใน Bitget</a>`;
}

window.addEventListener("load", initUI);
