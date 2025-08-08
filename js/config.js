// ==== Network / Addresses ====
const CONFIG = {
  CHAIN_ID_HEX: "0x38",              // BSC Mainnet
  CHAIN_ID_DEC: 56,
  BSC_SCAN: "https://bscscan.com",

  USDT: "0x55d398326f99059fF775485246999027B3197955",   // 18 decimals (ตามที่คุณยืนยัน)
  KJC:  "0xd479ae350dc24168e8db863c5413c35fb2044ecd",
  ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap V2 Router
  LP: "0xdF0d76046E72C183142c5208Ea0247450475A0DF",     // KJC/USDT LP
  AUTO_STAKER: "0xf24bb50d20b64329290D2144016Bf13b5f901710" // KJCLPAutostakerV2
};

// ==== Minimal ABIs ====
// ERC20 (approve/allowance/decimals/balanceOf)
const ERC20_ABI = [
  {"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"},
  {"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function"},
  {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},
  {"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"}
];

// Pancake V2 Router (ใช้แค่ getAmountsOut)
const ROUTER_ABI = [
  {"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],
   "name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"}
];

// KJCLPAutostakerV2 (เฉพาะที่ UI นี้ใช้)
const AUTO_STAKER_ABI = [
  {"inputs":[{"internalType":"uint256","name":"usdtAmount","type":"uint256"},{"internalType":"uint256","name":"minKJC","type":"uint256"}],
   "name":"buyAndStake","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"claimStakingReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"claimReferralReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"ref","type":"address"}],"name":"setReferrer","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

window.__APP_CONFIG__ = { CONFIG, ERC20_ABI, ROUTER_ABI, AUTO_STAKER_ABI };
