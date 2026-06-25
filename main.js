// ==================== 1. 全域資料與細態基礎設定 ====================
const defaultData = {
  name: "勇者", coins: 1200, stage: 1, score: 0, energy: 0, combo: 0, squat: 0,
  roleLevel: 1, roleAttack: 10, dailyDay: 1, lastClaim: "", walkDistance: 0.0,
  shop: [
    { id: "weapon_1", name: "鏽鐵短劍", icon: "🗡️", level: 1, baseStat: 3, cost: 100, desc: "新手必備的基礎短劍" },
    { id: "weapon_2", name: "王者之劍", icon: "⚔️", level: 0, baseStat: 8, cost: 250, desc: "大幅強化深蹲揮斬威力" },
    { id: "weapon_3", name: "龍牙巨劍", icon: "🐉", level: 0, baseStat: 18, cost: 600, desc: "巨龍骨牙打造的終極利刃" },
    { id: "shield_1", name: "木製圓盾", icon: "🪵", level: 0, baseStat: 2, cost: 120, desc: "略微提升關卡防護力" },
    { id: "shield_2", name: "聖光光盾", icon: "🛡️", level: 0, baseStat: 6, cost: 400, desc: "通關獲得額外代幣加成" },
    { id: "shield_3", name: "宙斯神盾", icon: "⚡", level: 0, baseStat: 15, cost: 850, desc: "雷霆環繞的神之庇護盾" },
    { id: "boots_1", name: "皮製長靴", icon: "🥾", level: 0, baseStat: 2, cost: 150, desc: "稍微優化行軍走路收益" },
    { id: "boots_2", name: "泰坦戰靴", icon: "👟", level: 0, baseStat: 5, cost: 350, desc: "提升遠征走路的代幣回饋" },
    { id: "boots_3", name: "光速神鞋", icon: "✨", level: 0, baseStat: 14, cost: 900, desc: "踏光而行，走路獲得雙倍代幣" }
  ],
  pets: [
    { id: 1, name: "光靈幼獸", icon: "🐾", rarity: "稀有", level: 1, attack: 12, owned: true, active: true },
    { id: 2, name: "焰火狐", icon: "🔥", rarity: "史詩", level: 1, attack: 25, owned: false, active: false },
    { id: 3, name: "星辰貓", icon: "🌙", rarity: "傳說", level: 1, attack: 45, owned: false, active: false },
    { id: 4, name: "雷霆泰迪", icon: "🧸", rarity: "傳說", level: 1, attack: 60, owned: false, active: false },
    { id: 5, name: "混沌巨龍", icon: "🐉", rarity: "神話", level: 1, attack: 100, owned: false, active: false }
  ]
};

let data = JSON.parse(localStorage.getItem("squatRPG")) || defaultData;
let bossHp = 100; let maxBossHp = 100;
let poseStarted = false; let squatState = "up"; let lastAttackTime = 0;
let lastPosition = null; 

const MIN_SPEED_KMH = 3.0;  // 必須大於等於 3 公里/小時才列入計算
const MAX_SPEED_KMH = 15.0; // 超過 15 公里/小時判定為交通工具不列入

let audioCtx = null;
function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (type === "slash") {
      osc.type = "triangle"; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime); osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === "crit") {
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime); osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch (e) {}
}

const screens = ["homeScreen", "loginScreen", "lobbyScreen", "mapScreen", "petScreen", "roleScreen", "gachaScreen", "dailyScreen", "rankScreen", "gameScreen"];

window.addEventListener("DOMContentLoaded", () => {
  const toLoginBtn = document.getElementById("toLoginBtn");
  if (toLoginBtn) toLoginBtn.addEventListener("click", () => { showScreen("loginScreen"); });

  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.addEventListener("click", startGame);
  
  const nameInput = document.getElementById("nameInput");
  if (nameInput) {
    nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") startGame(); });
  }
  refreshTop();
});

function save() {
  localStorage.setItem("squatRPG", JSON.stringify(data));
  refreshTop();
}

function showScreen(id) {
  screens.forEach(s => { 
    const el = document.getElementById(s); if(el) el.classList.remove("active"); 
  });
  const target = document.getElementById(id); if(target) target.add ? target.classList.add("active") : target.className += " active";
  refreshTop();
}

function startGame() {
  const nameInput = document.getElementById("nameInput");
  const name = nameInput ? nameInput.value.trim() : "";
  if (name === "") { alert("請先輸入勇者名稱"); return; }
  data.name = name; save(); showScreen("lobbyScreen"); initMobileGps();
}

function refreshTop() {
  if (document.getElementById("lobbyName")) document.getElementById("lobbyName").textContent = data.name;
  if (document.getElementById("playerName")) document.getElementById("playerName").textContent = data.name;
  if (document.getElementById("coinText")) document.getElementById("coinText").textContent = "🪙 " + data.coins;
  if (document.getElementById("playerLevelText")) document.getElementById("playerLevelText").textContent = "LV." + data.roleLevel + " 聖殿騎士";
  if (document.getElementById("lobbyWalkDist")) document.getElementById("lobbyWalkDist").textContent = Number(data.walkDistance).toFixed(2);
  
  const mainWeapon = data.shop ? data.shop.find(i => i.id.startsWith("weapon") && i.level > 0) : null;
  if (document.getElementById("battleWeaponText") && mainWeapon) {
    document.getElementById("battleWeaponText").textContent = `裝備: ${mainWeapon.name} (階級 ${mainWeapon.level})`;
  }
}

// ==================== 2. GPS 遠征系統 ====================
function initMobileGps() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition((position) => {
    const coords = position.coords; const speedMps = coords.speed;
    let currentSpeedKmh = (speedMps !== null && speedMps >= 0) ? speedMps * 3.6 : 0;
    
    if ((speedMps === null || currentSpeedKmh === 0) && lastPosition) {
      const dMeters = calcDistanceMeters(lastPosition.latitude, lastPosition.longitude, coords.latitude, coords.longitude);
      currentSpeedKmh = dMeters * 3.6;
    }

    if (document.getElementById("lobbyWalkSpeed")) document.getElementById("lobbyWalkSpeed").textContent = currentSpeedKmh.toFixed(1);
    const msgEl = document.getElementById("lobbyWalkMsg");
    
    if (currentSpeedKmh < MIN_SPEED_KMH) {
      if(msgEl) { msgEl.textContent = "💤 原地休憩中 (時速小於 3km/h 不計距離)"; msgEl.className = "walk-msg"; }
      lastPosition = coords; return;
    }
    if (currentSpeedKmh > MAX_SPEED_KMH) {
      if(msgEl) { msgEl.textContent = "⚠️ 速度過快！行軍遠征暫停計算"; msgEl.className = "walk-msg warn"; }
      lastPosition = coords; return;
    }
    
    if (lastPosition) {
      const distMeters = calcDistanceMeters(lastPosition.latitude, lastPosition.longitude, coords.latitude, coords.longitude);
      if (distMeters > 2 && distMeters < 100) {
        data.walkDistance += (distMeters / 1000);
        data.coins += Math.floor(distMeters / 10) * 5; save();
      }
    }
    if(msgEl) { msgEl.textContent = "🟢 聖騎士全速行軍中！"; msgEl.className = "walk-msg ok"; }
    lastPosition = coords;
  }, null, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}

function calcDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; const φ1 = lat1 * Math.PI / 180; const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180; const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
}

// ==================== 3. 皇家鐵匠鋪 (商店) ====================
function openRole() {
  document.getElementById("roleTitle").textContent = "殿堂騎士階級 Lv." + data.roleLevel;
  document.getElementById("roleDesc").innerHTML = "基礎攻擊力：" + data.roleAttack;
  renderShop(); showScreen("roleScreen");
}
function upgradeRole() {
  const cost = data.roleLevel * 300; if (data.coins < cost) { alert("健身幣不足！"); return; }
  data.coins -= cost; data.roleLevel++; data.roleAttack += 6; save(); openRole();
}
function renderShop() {
  const box = document.getElementById("shopItems"); if(!box) return; box.innerHTML = "";
  if(!data.shop || data.shop.length < 9) data.shop = defaultData.shop;
  data.shop.forEach(item => {
    const card = document.createElement("div"); card.className = "shop-item-card";
    card.innerHTML = `
      <div class="shop-item-left">
        <div class="shop-item-icon">${item.icon}</div>
        <div>
          <div class="shop-item-name">${item.name} <span style="color:#eab308">Lv.${item.level}</span></div>
          <div class="shop-item-stat">${item.desc} (威力: +${item.level * item.baseStat})</div>
        </div>
      </div>
      <button class="small-btn" onclick="buyShopItem('${item.id}')">⚒️ 鍛造 (${item.cost}🪙)</button>
    `;
    box.appendChild(card);
  });
}
function buyShopItem(id) {
  const item = data.shop.find(i => i.id === id); if (data.coins < item.cost) { alert("健身幣餘額不足！"); return; }
  data.coins -= item.cost; item.level++; item.cost = Math.floor(item.cost * 1.6); save(); renderShop();
}

// ==================== 4. 戰鬥核心 ====================
function startBattle() {
  const isElite = data.stage % 10 === 0;
  maxBossHp = isElite ? (150 + data.stage * 20) : (80 + data.stage * 15); 
  bossHp = maxBossHp;
  
  document.getElementById("stageText").textContent = isElite ? "👑 領主魔王戰" : "地城 STAGE " + data.stage;
  document.getElementById("boss").textContent = isElite ? "👹" : "👾";
  
  const currentPet = activePet();
  const petIconEl = document.getElementById("battlePet");
  const petLabelEl = document.getElementById("battlePetLabel");
  if (petIconEl && petLabelEl) {
    petIconEl.textContent = currentPet.icon;
    petLabelEl.textContent = currentPet.name + " (助攻)";
  }

  updateBattleUI(); showScreen("gameScreen");
  if (!poseStarted) { poseStarted = true; startCameraAndPose(); }
}

function onSquatSuccess() {
  const pet = activePet();
  const isCrit = (data.combo > 0 && data.combo % 4 === 0);
  
  let shopBonus = 0;
  if(data.shop) {
    data.shop.forEach(i => { shopBonus += (i.level * i.baseStat); });
  }
  
  const dmg = data.roleAttack + pet.attack + shopBonus + (isCrit ? 35 : 0);
  bossHp = Math.max(0, bossHp - dmg);

  data.score += 15; data.energy += 1; data.combo += 1; data.squat += 1;
  data.coins += 6; playSound(isCrit ? "crit" : "slash");

  const flt = document.getElementById("floatingText");
  if(flt) flt.textContent = isCrit ? "💥 CRITICAL -" + dmg : "⚔️ -" + dmg;

  triggerVfx(); updateBattleUI(); save();

  if (bossHp <= 0) {
    setTimeout(() => {
      alert(`🎉 成功擊殺 STAGE ${data.stage} 怪物！`);
      data.coins += data.stage * 40; 
      data.stage++; 
      data.combo = 0; 
      save(); 
      openMap(); 
    }, 600);
  }
}

function triggerVfx() {
  const partySide = document.getElementById("playerParty");
  const bossSide = document.getElementById("enemyBossSide");
  const e = document.getElementById("hitEffect");
  const f = document.getElementById("floatingText");
  const s = document.getElementById("slashLine");

  if(!partySide || !bossSide || !e || !f || !s) return;
  
  partySide.classList.remove("attack-anim");
  bossSide.classList.remove("hurt-anim");
  e.classList.remove("show"); f.classList.remove("show"); s.classList.remove("show");
  
  void bossSide.offsetWidth; 
  
  partySide.classList.add("attack-anim");
  bossSide.classList.add("hurt-anim");
  e.classList.add("show"); f.classList.add("show"); s.classList.add("show");
}

function updateBattleUI() {
  if(document.getElementById("score")) document.getElementById("score").textContent = data.score;
  if(document.getElementById("energy")) document.getElementById("energy").textContent = data.energy;
  if(document.getElementById("squatCount")) document.getElementById("squatCount").textContent = data.squat;
  if(document.getElementById("combo")) document.getElementById("combo").textContent = "COMBO x" + data.combo;
  if(document.getElementById("hpText")) document.getElementById("hpText").textContent = bossHp + " / " + maxBossHp;
  if(document.getElementById("hpFill")) document.getElementById("hpFill").style.width = ((bossHp / maxBossHp) * 100) + "%";
}

// ==================== 5. 戰寵與抽獎 ====================
function openPets() {
  const box = document.getElementById("petList"); if(!box) return; box.innerHTML = "";
  if(!data.pets || data.pets.length < 5) data.pets = defaultData.pets;
  data.pets.forEach(p => {
    const div = document.createElement("div"); div.className = "feature-card";
    div.innerHTML = `<div class="big">${p.icon}</div><h2>${p.name} <span class="badge">${p.rarity}</span></h2>
      <p>等級 Lv.${p.level} | 額外加成攻擊: +${p.attack}<br>${p.owned ? '✅ 已召喚解鎖' : '🔒 封印於聖物箱中'}</p>
      <div class="card-row">
        <button class="small-btn" onclick="setPet(${p.id})">${p.active ? '⚔️ 戰鬥中' : '配置出擊'}</button>
        <button class="small-btn" onclick="upgradePet(${p.id})">魔力強化</button>
      </div>`;
    box.appendChild(div);
  });
  showScreen("petScreen");
}
function setPet(id) {
  const pet = data.pets.find(p => p.id === id); if (!pet.owned) { alert("此戰寵尚未解鎖，快去破譯幸運寶箱！"); return; }
  data.pets.forEach(p => p.active = false); pet.active = true; save(); openPets();
}
function upgradePet(id) {
  const pet = data.pets.find(p => p.id === id); if (!pet.owned) return;
  const cost = pet.level * 200; if (data.coins < cost) { alert("健身幣不夠！"); return; }
  data.coins -= cost; pet.level++; pet.attack += 8; save(); openPets();
}
function openGacha() { document.getElementById("gachaResult").textContent = ""; showScreen("gachaScreen"); }
function drawGacha() {
  if (data.coins < 300) { alert("健身幣不足開箱！"); return; }
  data.coins -= 300; if(!data.pets || data.pets.length < 5) data.pets = defaultData.pets;
  const r = Math.random() * 100;
  let pet = data.pets[0];
  if (r < 5) pet = data.pets[4];
  else if (r < 15) pet = data.pets[3];
  else if (r < 35) pet = data.pets[2];
  else if (r < 65) pet = data.pets[1];
  
  pet.owned = true;
  document.getElementById("gachaResult").innerHTML = `🔮 聖物覺醒！獲得：${pet.icon} 【${pet.name}】(${pet.rarity})`; save();
}

// ==================== 地圖系統 (修正：補上點擊進入當前關卡戰鬥事件) ====================
function openMap() { renderMap(); showScreen("mapScreen"); }
function renderMap() {
  const box = document.getElementById("mapNodes"); if(!box) return; box.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const node = document.createElement("div"); node.className = "stage-node";
    if (i % 10 === 0) node.classList.add("elite"); 
    
    if (i === data.stage) {
      node.classList.add("current");
    } else if (i < data.stage) {
      node.classList.add("cleared"); // 已通關標記
    } else {
      node.classList.add("locked"); // 未解鎖標記
    }
    
    node.textContent = i % 10 === 0 ? "👹" : i;
    node.style.top = (30 + (i - 1) * 32) + "px"; node.style.left = (i % 2 === 0 ? 240 : 90) + "px"; 
    
    // 🔥 修正核心：點擊關卡節點觸發戰鬥
    node.addEventListener("click", () => {
      if (i === data.stage) {
        startBattle(); // 只有當前解鎖的最新關卡能點擊進入
      } else if (i < data.stage) {
        alert("這關你已經完美淨化囉！請挑戰最新的當前關卡！");
      } else {
        alert("前置地下城尚未突破，無法前進！");
      }
    });

    box.appendChild(node);
  }
}

function openDaily() {
  const box = document.getElementById("dailyList"); if(!box) return; box.innerHTML = "";
  for(let i=0; i<7; i++) { box.innerHTML += `<div class="feature-card" style="padding:10px"><h4>第 ${i + 1} 天</h4><p>🪙 ${(i+1)*120}</p></div>`; }
  showScreen("dailyScreen");
}
function claimDaily() {
  const dStr = new Date().toISOString().slice(0, 10); if (data.lastClaim === dStr) { alert("今日已領取過囉！"); return; }
  data.coins += (data.dailyDay * 120); data.dailyDay = data.dailyDay === 7 ? 1 : data.dailyDay + 1; data.lastClaim = dStr; save(); openDaily();
}
function activePet() { if(!data.pets) return defaultData.pets[0]; return data.pets.find(p => p.active && p.owned) || data.pets[0]; }

// ==================== 6. MediaPipe 體感 AI ====================
async function startCameraAndPose() {
  const video = document.getElementById("webcam"); const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d"); const statusText = document.getElementById("cameraStatus");
  const pose = new Pose({ locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/pose/" + file });
  pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.45, minTrackingConfidence: 0.45 });
  pose.onResults((results) => {
    canvas.width = video.videoWidth || 480; canvas.height = video.videoHeight || 640; ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#38bdf8", lineWidth: 3 });
      drawLandmarks(ctx, results.poseLandmarks, { color: "#ca8a04", lineWidth: 1.5 });
      checkLiveSquat(results.poseLandmarks);
    }
  });
  try {
    const camera = new Camera(video, { onFrame: async () => { await pose.send({ image: video }); }, width: 480, height: 640 });
    await camera.start(); if(statusText) statusText.textContent = "🛡️ 領主血條";
  } catch (err) { if(statusText) statusText.textContent = "相機不可用"; }
}
function checkLiveSquat(lm) {
  const lh = lm[23], lk = lm[25], la = lm[27], rh = lm[24], rk = lm[26], ra = lm[28];
  if (lk.visibility < 0.4 || la.visibility < 0.4 || rk.visibility < 0.4 || ra.visibility < 0.4) return;
  const minAngle = Math.min(calcAngle(lh, lk, la), calcAngle(rh, rk, ra));
  if(document.getElementById("debug")) document.getElementById("debug").textContent = "膝蓋角度：" + Math.round(minAngle) + "°";
  if (squatState === "up" && minAngle < 130) squatState = "down";
  if (squatState === "down" && minAngle > 155) {
    const now = Date.now(); if (now - lastAttackTime > 750) { onSquatSuccess(); lastAttackTime = now; }
    squatState = "up";
  }
}
function calcAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y }; const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y; const len = Math.sqrt(ab.x**2 + ab.y**2) * Math.sqrt(cb.x**2 + cb.y**2);
  return Math.acos(Math.min(1, Math.max(-1, dot / len))) * 180 / Math.PI;
}
