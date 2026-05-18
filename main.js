let score = 0;
let energy = 0;
let combo = 0;
let bossHp = 100;
let maxBossHp = 100;

const webcam = document.getElementById("webcam");
const scoreText = document.getElementById("score");
const energyText = document.getElementById("energy");
const comboText = document.getElementById("combo");
const boss = document.getElementById("boss");
const pet = document.getElementById("pet");
const hitEffect = document.getElementById("hitEffect");
const floatingText = document.getElementById("floatingText");
const bossHpBar = document.getElementById("bossHpBar");
const bossHpText = document.getElementById("bossHpText");
const hitSound = document.getElementById("hitSound");

// 開啟攝影機
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    webcam.srcObject = stream;
  } catch (error) {
    alert("無法開啟攝影機，請確認瀏覽器有允許權限");
    console.error(error);
  }
}

startWebcam();

function onSquatSuccess() {
  score += 10;
  energy += 1;
  combo += 1;

  let damage = 8;

  if (combo % 5 === 0) {
    damage = 18;
    floatingText.innerText = "CRITICAL!";
  } else {
    floatingText.innerText = "HIT!";
  }

  bossHp -= damage;

  if (bossHp < 0) {
    bossHp = 0;
  }

  updateUI();
  bossHitAnimation();
  petAttackAnimation();
  showHitEffect();
  showFloatingText();
  playHitSound();

  if (bossHp <= 0) {
    nextStage();
  }
}

function updateUI() {
  scoreText.innerText = score;
  energyText.innerText = energy;
  comboText.innerText = "COMBO x" + combo;

  comboText.classList.remove("show");
  void comboText.offsetWidth;
  comboText.classList.add("show");

  const hpPercent = (bossHp / maxBossHp) * 100;
  bossHpBar.style.width = hpPercent + "%";
  bossHpText.innerText = bossHp + " / " + maxBossHp;
}

function bossHitAnimation() {
  boss.classList.remove("hit");
  void boss.offsetWidth;
  boss.classList.add("hit");
}

function petAttackAnimation() {
  pet.classList.remove("petAttack");
  void pet.offsetWidth;
  pet.classList.add("petAttack");
}

function showHitEffect() {
  hitEffect.classList.remove("show");
  void hitEffect.offsetWidth;
  hitEffect.classList.add("show");
}

function showFloatingText() {
  floatingText.classList.remove("show");
  void floatingText.offsetWidth;
  floatingText.classList.add("show");
}

function playHitSound() {
  hitSound.currentTime = 0;
  hitSound.play().catch(() => {
    console.log("音效尚未被瀏覽器允許播放");
  });
}

function nextStage() {
  setTimeout(() => {
    alert("Boss 擊敗！進入下一個探險地圖！");

    bossHp = maxBossHp;
    combo = 0;

    updateUI();
  }, 500);
}

// 測試用：按空白鍵等於成功深蹲一次
document.addEventListener("keydown", function(event) {
  if (event.code === "Space") {
    onSquatSuccess();
  }
});
