const { CONFIG, ERC20_ABI, ROUTER_ABI, AUTO_STAKER_ABI } = window.__APP_CONFIG__;

function getContracts() {
  if (!signer) throw new Error("กรุณาเชื่อมต่อกระเป๋าก่อน");
  const usdt = new ethers.Contract(CONFIG.USDT, ERC20_ABI, signer);
  const router = new ethers.Contract(CONFIG.ROUTER, ROUTER_ABI, signer);
  const staker = new ethers.Contract(CONFIG.AUTO_STAKER, AUTO_STAKER_ABI, signer);
  return { usdt, router, staker };
}

// ---------- Swap quote ----------
async function calcKJCOut(usdtAmount) {
  const { router } = getContracts();
  const usdtWei = ethers.utils.parseUnits(usdtAmount, 18); // USDT 18d
  const path = [CONFIG.USDT, CONFIG.KJC];
  const amounts = await router.getAmountsOut(usdtWei, path);
  return amounts[1];
}

function applySlippage(amountWei, slippagePercent) {
  const bps = ethers.BigNumber.from(10000);
  const s = ethers.BigNumber.from(Math.floor(slippagePercent * 100));
  return amountWei.mul(bps.sub(s)).div(bps);
}

async function ensureAllowance(usdt, owner, spender, needed) {
  const current = await usdt.allowance(owner, spender);
  if (current.gte(needed)) return;
  const toApprove = needed.mul(110).div(100);
  const tx = await usdt.approve(spender, toApprove);
  alert("⏳ ส่งคำสั่ง Approve แล้ว รอคอนเฟิร์ม…");
  await tx.wait();
}

// ---------- Ref / Buy & Stake ----------
async function setReferrerFlow() {
  const ref = document.getElementById("refAddress").value.trim();
  if (!ref || !/^0x[a-fA-F0-9]{40}$/.test(ref)) return alert("กรุณาใส่ Referrer Address ให้ถูกต้อง");
  const { staker } = getContracts();
  const tx = await staker.setReferrer(ref);
  alert("⏳ ตั้งค่า Referrer…"); await tx.wait();
  alert("✅ ตั้งค่า Referrer สำเร็จ!");
}

async function quoteFlow() {
  if (!signer) return alert("กรุณาเชื่อมต่อกระเป๋าก่อน");
  const amountStr = document.getElementById("usdtAmount").value;
  const slip = parseFloat(document.getElementById("slippage").value || "2");
  if (!amountStr || Number(amountStr) <= 0) return alert("กรุณาใส่จำนวน USDT");
  const out = await calcKJCOut(amountStr);
  const min = applySlippage(out, slip);
  document.getElementById("quoteBox").textContent =
    `คาดว่าจะได้ ~ ${ethers.utils.formatUnits(out, 18)} KJC | minKJC = ${ethers.utils.formatUnits(min, 18)} KJC`;
}

async function buyAndStakeFlow() {
  if (!signer) return alert("กรุณาเชื่อมต่อกระเป๋าก่อน");
  const amountStr = document.getElementById("usdtAmount").value;
  const slip = parseFloat(document.getElementById("slippage").value || "2");
  if (!amountStr || Number(amountStr) <= 0) return alert("กรุณาใส่จำนวน USDT");

  const { usdt, staker } = getContracts();
  const owner = await signer.getAddress();

  const out = await calcKJCOut(amountStr);
  const min = applySlippage(out, slip);

  const usdtWei = ethers.utils.parseUnits(amountStr, 18);
  await ensureAllowance(usdt, owner, CONFIG.AUTO_STAKER, usdtWei);

  const tx = await staker.buyAndStake(usdtWei, min, {});
  alert("⏳ ส่งคำสั่ง Buy&Stake แล้ว รอคอนเฟิร์ม…");
  const r = await tx.wait();
  alert("✅ สำเร็จ! Tx: " + r.transactionHash);

  // อัปเดตหน้าจอหลัง stake
  fetchAndRenderUser().catch(()=>{});
}

// ---------- Claim ----------
async function claimStakeFlow() {
  const { staker } = getContracts();
  const tx = await staker.claimStakingReward(); alert("⏳ เคลมรางวัล Staking…");
  const r = await tx.wait(); alert("✅ เคลมสำเร็จ\nTx: " + r.transactionHash);
}

async function claimRefFlow() {
  const { staker } = getContracts();
  const tx = await staker.claimReferralReward(); alert("⏳ เคลมรางวัล Referral…");
  const r = await tx.wait(); alert("✅ เคลมสำเร็จ\nTx: " + r.transactionHash);
}

// ---------- Your Stake (robust to unknown getters) ----------
function fmtTime(ts) {
  if (!ts || ts === "-" ) return "-";
  const n = Number(ts);
  if (!n) return "-";
  const d = new Date(n * 1000);
  return d.toLocaleString();
}

function fmtBN(bn, dec=18) {
  try { return ethers.utils.formatUnits(bn || 0, dec); } catch { return "-"; }
}

async function safeCall(fn) {
  try { return await fn(); } catch { return null; }
}

async function fetchUserRaw(staker, user) {
  // พยายามดึงค่าแบบทีละตัวเพื่อไม่พัง หาก method ไม่อยู่ในสัญญาจริง
  const [
    stakedLP,
    lastClaim,
    claimInterval,
    lockDuration,
    canW,
  ] = await Promise.all([
    safeCall(() => staker.stakedAmount(user)),
    safeCall(() => staker.lastClaim(user)),
    safeCall(() => staker.CLAIM_INTERVAL()),
    safeCall(() => staker.LOCK_DURATION()),
    safeCall(() => staker.canWithdraw(user)),
  ]);

  // referral rewards (ลอง 2 วิธี)
  let refRewards = await safeCall(() => staker.users(user).then(u => u.referralRewards));
  if (refRewards == null) {
    // อาจมี method อื่น เช่น users(address).referralRewards ถูกย้าย -> ไม่มี method ตรง ๆ ให้ดึง
    // ไม่เป็นไร แสดง "-" ไปก่อน
    refRewards = null;
  }

  return { stakedLP, lastClaim, claimInterval, lockDuration, canW, refRewards };
}

let unlockTimer;
function setWithdrawButtonEnabled(enabled) {
  const btn = document.getElementById("btnWithdraw");
  if (enabled) {
    btn.classList.remove("disabled");
  } else {
    btn.classList.add("disabled");
  }
}

async function fetchAndRenderUser() {
  if (!signer) return;
  const { staker } = getContracts();
  const user = await signer.getAddress();
  const info = await fetchUserRaw(staker, user);

  // Staked LP
  document.getElementById("uiStakedLP").textContent = info.stakedLP ? fmtBN(info.stakedLP, 18) : "-";

  // Times
  const last = info.lastClaim ? Number(info.lastClaim) : 0;
  const next = (last && info.claimInterval) ? last + Number(info.claimInterval) : 0;

  document.getElementById("uiLastClaim").textContent = last ? fmtTime(last) : "-";
  document.getElementById("uiNextClaim").textContent = next ? fmtTime(next) : "-";

  // Unlock time = last stake start + LOCK_DURATION (ถ้าไม่มีก็ใส่ "-")
  // ในบางสัญญา unlock อาจใช้เวลาเริ่มต้นอื่น ๆ — ที่นี่เราประมาณจาก lastClaim ถ้าไม่มี getter เฉพาะ
  let unlockAt = 0;
  if (info.lockDuration && last) unlockAt = last + Number(info.lockDuration);
  document.getElementById("uiUnlockAt").textContent = unlockAt ? fmtTime(unlockAt) : "-";

  // Referral rewards
  document.getElementById("uiRefRewards").textContent = info.refRewards ? fmtBN(info.refRewards, 18) : "-";

  // canWithdraw
  const canW = info.canW === true || info.canW === false ? info.canW : (unlockAt ? (Date.now()/1000 >= unlockAt) : false);
  document.getElementById("uiCanWithdraw").textContent = canW ? "✅ ถอน LP ได้" : "⏳ ยังล็อกอยู่";
  setWithdrawButtonEnabled(!!canW);

  // ถ้าถอนยังไม่ได้ ให้โชว์เคาน์ต์ดาวน์สั้น ๆ (อัปเดตทุก 10 วิ)
  if (!canW && unlockAt) {
    if (unlockTimer) clearInterval(unlockTimer);
    const el = document.getElementById("uiUnlockAt");
    const tick = () => {
      const now = Math.floor(Date.now()/1000);
      const remain = unlockAt - now;
      if (remain <= 0) {
        el.textContent = "ถึงเวลาแล้ว";
        setWithdrawButtonEnabled(true);
        clearInterval(unlockTimer);
      } else {
        const h = Math.floor(remain/3600);
        const m = Math.floor((remain%3600)/60);
        const s = remain%60;
        el.textContent = `${h} ชม ${m} นาที ${s} วินาที`;
      }
    };
    tick();
    unlockTimer = setInterval(tick, 10000);
  }
}

async function withdrawFlow() {
  if (!signer) return alert("กรุณาเชื่อมต่อกระเป๋าก่อน");
  const { staker } = getContracts();
  const btn = document.getElementById("btnWithdraw");
  if (btn.classList.contains("disabled")) return alert("ยังถอน LP ไม่ได้ (ยังไม่ถึงเวลา)");
  if (!confirm("ยืนยันถอน LP ทั้งหมดออกจากการล็อก?")) return;

  const tx = await staker.withdrawLP();
  alert("⏳ ส่งคำสั่ง Withdraw LP…");
  const r = await tx.wait();
  alert("✅ ถอน LP สำเร็จ\nTx: " + r.transactionHash);

  fetchAndRenderUser().catch(()=>{});
}

// wire buttons
function wireButtons() {
  document.getElementById("btnSetRef").onclick = () => setReferrerFlow().catch(e => alert(e.message||e));
  document.getElementById("btnQuote").onclick  = () => quoteFlow().catch(e => alert(e.message||e));
  document.getElementById("btnBuyStake").onclick = () => buyAndStakeFlow().catch(e => alert(e.message||e));
  document.getElementById("btnClaimStake").onclick = () => claimStakeFlow().catch(e => alert(e.message||e));
  document.getElementById("btnClaimRef").onclick   = () => claimRefFlow().catch(e => alert(e.message||e));
  document.getElementById("btnRefresh").onclick    = () => fetchAndRenderUser().catch(e => alert(e.message||e));
  document.getElementById("btnWithdraw").onclick   = () => withdrawFlow().catch(e => alert(e.message||e));
}

window.addEventListener("load", () => {
  wireButtons();
  // auto refresh เมื่อผู้ใช้เชื่อมต่อกระเป๋า (wallet.js จะอัปเดต status แล้ว)
  setInterval(() => { if (signer) fetchAndRenderUser().catch(()=>{}); }, 15000);
});
