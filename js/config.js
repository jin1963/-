// ===============================
// config.js  (KJC LP Auto Stake)
// ===============================

// ---- Network / Chain ----
const CONFIG = {
  // BSC Mainnet
  CHAIN_ID_HEX: "0x38",
  CHAIN_ID_DEC: 56,
  RPC_FALLBACKS: [
    // ใช้แค่กรณีคุณอยากตั้ง provider เองในอนาคต (ตอนนี้ไม่จำเป็น)
    "https://bsc-dataseed1.binance.org",
    "https://bsc-dataseed2.binance.org"
  ],
  BSC_SCAN: "https://bscscan.com",

  // ---- Addresses (ยืนยันจากโปรเจกต์ของคุณ) ----
  USDT: "0x55d398326f99059fF775485246999027B3197955",  // USDT (BEP-20) 18 decimals
  KJC:  "0xd479ae350dc24168e8db863c5413c35fb2044ecd",  // KJC Token
  ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap V2 Router
  LP: "0xdF0d76046E72C183142c5208Ea0247450475A0DF",     // KJC/USDT LP
  AUTO_STAKER: "0xf24bb50d20b64329290D2144016Bf13b5f901710", // KJCLPAutostakerV2

  // ---- UI Defaults ----
  DEFAULT_SLIPPAGE_PERCENT: 2,        // เปอร์เซ็นต์ slippage เริ่มต้น
  USDT_DECIMALS: 18,                  // ยืนยันแล้วว่า USDT ตัวนี้ 18 ทศนิยม
  KJC_DECIMALS: 18,                   // ส่วนใหญ่ 18
  LP_DECIMALS: 18                     // LP ส่วนใหญ่ 18
};

// ---- ERC-20 ABI (ครบพอสำหรับ UI) ----
const ERC20_ABI = [
  // reads
  {"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"type":"function"},
  {"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"type":"function"},
  {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},
  {"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"", "type":"uint256"}],"type":"function"},
  {"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","outputs":[{"name":"", "type":"uint256"}],"type":"function"},
  {"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"", "type":"uint256"}],"type":"function"},

  // writes
  {"constant":false,"inputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"", "type":"bool"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"", "type":"bool"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"sender","type":"address"},{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"", "type":"bool"}],"type":"function"},

  // events
  {"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}
];

// ---- PancakeSwap V2 Router ABI (เฉพาะที่ต้องใช้) ----
const ROUTER_ABI = [
  // ใช้สำหรับคำนวณจำนวนที่จะได้ (USDT -> KJC)
  {
    "inputs":[
      {"internalType":"uint256","name":"amountIn","type":"uint256"},
      {"internalType":"address[]","name":"path","type":"address[]"}
    ],
    "name":"getAmountsOut",
    "outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],
    "stateMutability":"view","type":"function"
  }
  // ถ้าคุณต้องการ call อื่น ๆ ของ router เพิ่ม ค่อยเติมภายหลังได้
];

// ---- KJCLPAutostakerV2 ABI (เฉพาะ method ที่ UI ใช้) ----
// *** สำคัญ: ผมตั้งใจให้ UI ทนทาน หากไม่มีบาง view function ในสัญญาจริง โค้ดจะไม่พัง แค่แสดง "-" ***
const AUTO_STAKER_ABI = [
  // --- write ---
  {
    "inputs":[
      {"internalType":"uint256","name":"usdtAmount","type":"uint256"},
      {"internalType":"uint256","name":"minKJC","type":"uint256"}
    ],
    "name":"buyAndStake",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {"inputs":[],"name":"claimStakingReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"claimReferralReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"ref","type":"address"}],"name":"setReferrer","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"withdrawLP","outputs":[],"stateMutability":"nonpayable","type":"function"},

  // --- read / view (อาจมีหรือไม่มี ขึ้นกับเวอร์ชันสัญญา) ---
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"stakedAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"canWithdraw","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"lastClaim","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},

  // ค่าคงที่
  {"inputs":[],"name":"CLAIM_INTERVAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"LOCK_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"APY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}

  // หมายเหตุ: หากสัญญาจริงมี getter `users(address)` พร้อม fields (เช่น referralRewards, stakeStart, ฯลฯ)
  // บอก signature ที่แท้จริงมาได้เลย เดี๋ยวผมเพิ่มให้ตรง 1:1 เพื่อให้ UI แสดงผลละเอียด 100%
];

// ---- Export ไปให้ไฟล์อื่นใช้งาน ----
window.__APP_CONFIG__ = {
  CONFIG,
  ERC20_ABI,
  ROUTER_ABI,
  AUTO_STAKER_ABI
};
