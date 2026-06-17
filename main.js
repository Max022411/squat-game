// ==================== 1. 全域資料與細態基礎設定 ====================
const defaultData = {
  name: "勇者", coins: 1200, stage: 1, score: 0, energy: 0, combo: 0, squat: 0,
  roleLevel: 1, roleAttack: 10, dailyDay: 1, lastClaim: "", walkDistance: 0.0,
  shop: [
    { id: "weapon", name: "王者之劍", icon: "⚔️", level: 1, baseStat: 8, cost: 250, desc: "大幅強化深蹲揮斬威力" },
    { id: "shield", name: "聖光光盾", icon: "🛡️", level: 0, baseStat: 5, cost: 400, desc: "通關獲得額外代幣加成" },
    { id: "boots", name: "泰坦戰靴", icon: "🥾", level: 0, baseStat: 4, cost: 350, desc: "提升遠征走路的代幣回饋" }
  ],
  pets: [
    { id: 1, name: "光靈幼獸", icon: "🐾", rarity: "稀有", level: 1, attack: 12, owned: true, active: true },
    { id: 2, name: "焰火狐", icon: "🔥", rarity: "史詩", level: 1, attack: 25, owned: false, active: false },
    { id: 3, name: "星辰貓", icon: "🌙", rarity: "傳說", level: 1, attack: 40, owned: false, active: false }
  ]
};

let data = JSON.parse(localStorage.getItem("squatRPG")) || defaultData;
let bossHp = 100; let maxBossHp = 100;
let poseStarted = false; let squatState = "up"; let lastAttackTime = 0;
let lastPosition = null; const SPEED_LIMIT_KMH = 15.0;

let audioCtx = null;
function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (type === "slash") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === "crit") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch (e) { console.log("音效播報暫緩"); }
}

const screens = ["homeScreen", "loginScreen", "lobbyScreen", "mapScreen", "petScreen", "roleScreen", "gachaScreen", "dailyScreen", "rankScreen", "gameScreen"];

// 核心修正：利用 DOMContentLoaded 確保 DOM 樹完全建置才開始綁定按鈕監聽器
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }
  
  const nameInput = document.getElementById("nameInput");
  if (nameInput) {
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startGame();
    });
  }

  // 預載首次 UI
  refreshTop();
});

function save() {
  localStorage.setItem("squatRPG", JSON.stringify(data));
  refreshTop();
}

function showScreen(id) {
  screens.forEach(s => { 
    const el = document.getElementById(s); 
    if(el) el.classList.remove("active"); 
  });
  const target = document.getElementById(id); 
  if(target) target.classList.add("active");
  refreshTop();
}

function startGame() {
  const nameInput = document.getElementById("nameInput");
  const name = nameInput ? nameInput.value.trim() : "";
  if (name === "") { alert("請先輸入勇者名稱"); return; }
  data.name = name; 
  save(); 
  showScreen("lobbyScreen"); 
  initMobileGps();
}

function refreshTop() {
  if (document.getElementById("lobbyName")) document.getElementById("lobbyName").textContent = data.name;
  if (document.getElementById("playerName")) document.getElementById("playerName").textContent = data.name;
  if (document.getElementById("coinText")) document.getElementById("coinText").textContent = "🪙 " + data.coins;
  if (document.getElementById("playerLevelText")) document.getElementById("playerLevelText").textContent = "LV." + data.roleLevel + " 聖殿騎士";
  if (document.getElementById("lobbyWalkDist")) document.getElementById("lobbyWalkDist").textContent = Number(data.walkDistance).toFixed(2);
  
  const activeWeapon = data.shop ? data.shop.find(i => i.id === "weapon") : null;
  if (document.getElementById("battleWeaponText") && activeWeapon) {
    document.getElementById("battleWeaponText").textContent = `裝備: ${activeWeapon.name} (階級 ${activeWeapon.level})`;
  }
}

// ==================== 2. GPS 遠征走路偵測 ====================
function initMobileGps() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition((position) => {
    const coords = position.coords;
    const speedMps = coords.speed;
    let currentSpeedKmh = (speedMps !== null && speedMps >= 0) ? speedMps * 3.6 : 0;

    if (document.getElementById("lobbyWalkSpeed")) document.getElementById("lobbyWalkSpeed").textContent = currentSpeedKmh.toFixed(1);
    const msgEl = document.getElementById("lobbyWalkMsg");

    if (currentSpeedKmh > SPEED_LIMIT_KMH) {
      if(msgEl) { msgEl.textContent = "⚠️ 速度過快！(捷運/開車中) 遠征獎勵暫停"; msgEl.className = "walk-msg warn"; }
      lastPosition = coords; return;
    }

    if (lastPosition) {
      const distMeters = calcDistanceMeters(lastPosition.latitude, lastPosition.longitude, coords.latitude, coords.longitude);
      if (distMeters > 2 && distMeters < 100) {
        data.walkDistance += (distMeters / 1000);
        
        const boots = data.shop ? data.shop.find(i => i.id === "boots") : null;
        const bonusMultiplier = boots ? (1 + boots.level * 0.15) : 1;
        const baseCoins = Math.floor(distMeters / 10) * 5;
        
        if (baseCoins > 0) {
          data.coins += Math.floor(baseCoins * bonusMultiplier);
        }
        save();
      }
    }
    if(msgEl) { msgEl.textContent = "🟢 軍隊穩健推進中，正在獲取行軍資產！"; msgEl.className = "walk-msg ok"; }
    lastPosition = coords;
  }, null, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}

function calcDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; const φ1 = lat1 * Math.PI / 180; const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180; const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
}

// ==================== 3. 皇家鐵匠鋪武器裝備商店系統 ====================
function openRole() {
  document.getElementById("roleTitle").textContent = "殿堂騎士階級 Lv." + data.roleLevel;
  document.getElementById("roleDesc").innerHTML = "基礎攻擊力：" + data.roleAttack;
  renderShop();
  showScreen("roleScreen");
}

function upgradeRole() {
  const cost = data.roleLevel * 300;
  if (data.coins < cost) { alert("健身幣不足，無法晉升階級！"); return; }
  data.coins -= cost; data.roleLevel++; data.roleAttack += 6; save(); openRole();
}

function renderShop() {
  const box = document.getElementById("shopItems"); if(!box) return;
  box.innerHTML = "";
  if(!data.shop) data.shop = defaultData.shop;

  data.shop.forEach(item => {
    const card = document.createElement("div");
    card.className = "shop-item-card";
    card.innerHTML = `
      <div class="shop-item-left">
        <div class="shop-item-icon">${item.icon}</div>
        <div>
          <div class="shop-item-name">${item.name} <span style="color:#eab308">階級 ${item.level}</span></div>
          <div class="shop-item-stat">${item.desc} (加成: +${item.level * item.baseStat})</div>
        </div>
      </div>
      <button class="small-btn" onclick="buyShopItem('${item.id}')">⚙️ 鍛造 (${item.cost}🪙)</button>
    `;
    box.appendChild(card);
  });
}

function buyShopItem(id) {
  const item = data.shop.find(i => i.id === id);
  if (data.coins < item.cost) { alert("皇家鐵匠告知：您的健身幣餘額不足以進行鍛造！"); return; }
  data.coins -= item.cost;
  item.level++;
  item.cost = Math.floor(item.cost * 1.5);
  save(); renderShop();
}

// ==================== 4. 戰鬥交鋒與特效、聲音連動 ====================
function startBattle() {
  const isElite = data.stage % 10 === 0;
  maxBossHp = isElite ? 250 : 100 + data.stage * 12; bossHp = maxBossHp;
  document.getElementById("stageText").textContent = isElite ? "👑 領主魔王戰" : "地城 STAGE " + data.stage;
  document.getElementById("boss").textContent = isElite ? "👹" : "👾";
  document.getElementById("pet").textContent = activePet().icon;
  updateBattleUI(); showScreen("gameScreen");
  if (!poseStarted) { poseStarted = true; startCameraAndPose(); }
}

function onSquatSuccess() {
  const pet = activePet();
  const isCrit = (data.combo > 0 && data.combo % 4 === 0);
  
  const weapon = data.shop ? data.shop.find(i => i.id === "weapon") : null;
  const weaponBonus = weapon ? (weapon.level * weapon.baseStat) : 0;
  
  const dmg = data.roleAttack + pet.attack + weaponBonus + (isCrit ? 30 : 0);
  bossHp = Math.max(0, bossHp - dmg);

  data.score += 15; data.energy += 1; data.combo += 1; data.squat += 1;
  
  const shield = data.shop ? data.shop.find(i => i.id === "shield") : null;
  const coinBonus = shield ? Math.floor(5 * (1 + shield.level * 0.2)) : 5;
  data.coins += coinBonus;

  playSound(isCrit ? "crit" : "slash");

  const flt = document.getElementById("floatingText");
  if(flt) flt.textContent = isCrit ? "💥 CRITICAL -" + dmg : "⚔️ -" + dmg;

  triggerVfx(); updateBattleUI(); save();

  if (bossHp <= 0) {
    setTimeout(() => {
      alert(`🎉 凱旋歸來！成功攻克關卡，獲得額外領主寶藏！`);
      data.coins += data.stage * 25; data.stage++; data.combo = 0; save(); openMap();
    }, 600);
  }
}

function triggerVfx() {
  const b = document.getElementById("boss");
  const p = document.getElementById("pet");
  const e = document.getElementById("hitEffect");
  const f = document.getElementById("floatingText");
  const s = document.getElementById("slashLine");

  if(!b || !p || !e || !f || !s) return;
  b.classList.remove("hurt-anim"); p.classList.remove("attack-anim"); e.classList.remove("show"); f.classList.remove("show"); s.classList.remove("show");
  void b.offsetWidth;
  b.classList.add("hurt-anim"); p.classList.add("attack-anim"); e.classList.add("show"); f.classList.add("show"); s.classList.add("show");
}

function updateBattleUI() {
  if(document.getElementById("score")) document.getElementById("score").textContent = data.score;
  if(document.getElementById("energy")) document.getElementById("energy").textContent = data.energy;
  if(document.getElementById("squatCount")) document.getElementById("squatCount").textContent = data.squat;
  if(document.getElementById("combo")) document.getElementById("combo").textContent = "COMBO x" + data.combo;
  if(document.getElementById("hpText")) document.getElementById("hpText").textContent = bossHp + " / " + maxBossHp;
  if(document.getElementById("hpFill")) document.getElementById("hpFill").style.width = ((bossHp / maxBossHp) * 100) + "%";
}

// ==================== 5. 其餘常規系統 (地圖/寵物/抽獎) ====================
function openMap() { renderMap(); showScreen("mapScreen"); }
function renderMap() {
  const box = document.getElementById("mapNodes"); if(!box) return; box.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const node = document.createElement("div"); node.className = "stage-node";
    if (i % 10 === 0) node.classList.add("elite");
    if (i === data.stage) node.classList.add("current");
    node.textContent = i % 10 === 0 ? "👹" : i;
    node.style.top = (30 + (i - 1) * 32) + "px"; node.style.left = (i % 2 === 0 ? 240 : 90) + "px"; box.appendChild(node);
  }
}
function openPets() {
  const box = document.getElementById("petList"); if(!box) return; box.innerHTML = "";
  data.pets.forEach(p => {
    const div = document.createElement("div"); div.className = "feature-card";
    div.innerHTML = `<div class="big">${p.icon}</div><h2>${p.name} <span class="badge ${p.rarity==='傳說'?'legend':'rare'}">${p.rarity}</span></h2>
      <p>Lv.${p.level} | 助攻力: +${p.attack}<br>${p.owned ? '已服役中' : '封印中'}</p>
      <div class="card-row"><button class="small-btn" onclick="setPet(${p.id})">${p.active ? '戰鬥出征中' : '配置出戰'}</button>
      <button class="small-btn" onclick="upgradePet(${p.id})">魔力升級</button></div>`;
    box.appendChild(div);
  });
  showScreen("petScreen");
}
function setPet(id) {
  const pet = data.pets.find(p => p.id === id); if (!pet.owned) { alert("你尚未解鎖此戰寵"); return; }
  data.pets.forEach(p => p.active = false); pet.active = true; save(); openPets();
}
function upgradePet(id) {
  const pet = data.pets.find(p => p.id === id); if (!pet.owned) return;
  const cost = pet.level * 200; if (data.coins < cost) { alert("健身幣不夠！"); return; }
  data.coins -= cost; pet.level++; pet.attack += 6; save(); openPets();
}
function openGacha() { document.getElementById("gachaResult").textContent = ""; showScreen("gachaScreen"); }
function drawGacha() {
  if (data.coins < 300) { alert("健身幣不足開箱！"); return; }
  data.coins -= 300; const r = Math.random() * 100;
  let pet = (r < 8) ? data.pets[2] : (r < 32 ? data.pets[1] : data.pets[0]); pet.owned = true;
  document.getElementById("gachaResult").innerHTML = `🔮 寶箱覺醒成功！獲得戰寵：${pet.icon} ${pet.name} (${pet.rarity})`; save();
}
function openDaily() {
  const box = document.getElementById("dailyList"); if(!box) return; box.innerHTML = "";
  for(let i=0; i<7; i++) {
    box.innerHTML += `<div class="feature-card" style="padding:10px"><h4>第 ${i + 1} 天</h4><p style="font-size:12px">🪙 ${(i+1)*120}</p></div>`;
  }
  showScreen("dailyScreen");
}
function claimDaily() {
  const dStr = new Date().toISOString().slice(0, 10);
  if (data.lastClaim === dStr) { alert("今日物資已簽到領取過囉！"); return; }
  data.coins += (data.dailyDay * 120); alert(`簽到成功！獲得 ${data.dailyDay * 120} 健身幣！`);
  data.dailyDay = data.dailyDay === 7 ? 1 : data.dailyDay + 1; data.lastClaim = dStr; save(); openDaily();
}
function openRank() {
  document.getElementById("rankSquat").textContent = data.squat + " 下";
  document.getElementById("rankStage").textContent = data.stage;
  document.getElementById("rankScore").textContent = data.score;
  showScreen("rankScreen");
}
function activePet() { return data.pets.find(p => p.active && p.owned) || data.pets[0]; }

// ==================== 6. MediaPipe 手機關節點偵測 ====================
async function startCameraAndPose() {
  const video = document.getElementById("webcam"); const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d"); const statusText = document.getElementById("cameraStatus");
  if(statusText) statusText.textContent = "AI 骨骼追蹤載入中...";

  const pose = new Pose({ locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/pose/" + file });
  pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.45, minTrackingConfidence: 0.45 });
  pose.onResults((results) => {
    canvas.width = video.videoWidth || 480; canvas.height = video.videoHeight || 640;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#38bdf8", lineWidth: 3 });
      drawLandmarks(ctx, results.poseLandmarks, { color: "#ca8a04", lineWidth: 1.5 });
      checkLiveSquat(results.poseLandmarks);
    }
  });

  try {
    const camera = new Camera(video, { onFrame: async () => { await pose.send({ image: video }); }, width: 480, height: 640 });
    await camera.start(); if(statusText) statusText.textContent = "🛡️ 領主血條";
  } catch (err) {
    if(statusText) statusText.textContent = "相機不可用";
  }
}

function checkLiveSquat(lm) {
  const lh = lm[23], lk = lm[25], la = lm[27];
  const rh = lm[24], rk = lm[26], ra = lm[28];
  if (lk.visibility < 0.4 || la.visibility < 0.4 || rk.visibility < 0.4 || ra.visibility < 0.4) return;

  const minAngle = Math.min(calcAngle(lh, lk, la), calcAngle(rh, rk, ra));
  if(document.getElementById("debug")) document.getElementById("debug").textContent = "體感關節角度：" + Math.round(minAngle) + "° | 狀態：" + squatState.toUpperCase();

  if (squatState === "up" && minAngle < 130) squatState = "down";
  if (squatState === "down" && minAngle > 155) {
    const now = Date.now();
    if (now - lastAttackTime > 750) { onSquatSuccess(); lastAttackTime = now; }
    squatState = "up";
  }
}

function calcAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y }; const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y; const len = Math.sqrt(ab.x**2 + ab.y**2) * Math.sqrt(cb.x**2 + cb.y**2);
  return Math.acos(Math.min(1, Math.max(-1, dot / len))) * 180 / Math.PI;
}
