* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Microsoft JhengHei", Arial, sans-serif;
  color: white;
  background: #030712;
}

.screen {
  display: none;
  min-height: 100vh;
}

.screen.active {
  display: flex;
}

/* 登入畫面 */
#loginScreen {
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  background:
    radial-gradient(circle at 20% 20%, rgba(0, 217, 255, 0.25), transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(255, 215, 0, 0.15), transparent 28%),
    linear-gradient(135deg, #020617, #07111f 55%, #020617);
}

.login-bg-glow {
  position: absolute;
  width: 420px;
  height: 420px;
  background: rgba(0, 217, 255, 0.15);
  filter: blur(80px);
  border-radius: 50%;
}

.login-card {
  width: 460px;
  padding: 42px;
  border-radius: 32px;
  text-align: center;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(0, 217, 255, 0.35);
  box-shadow: 0 0 45px rgba(0, 217, 255, 0.22);
  z-index: 2;
}

.game-logo {
  width: 86px;
  height: 86px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d9ff, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  box-shadow: 0 0 28px rgba(0, 217, 255, 0.7);
}

.login-card h1 {
  font-size: 48px;
  margin: 0;
  letter-spacing: 8px;
}

.login-card p {
  color: #00d9ff;
  letter-spacing: 5px;
  margin-bottom: 34px;
}

.login-form label {
  display: block;
  margin-bottom: 12px;
  font-size: 24px;
  font-weight: bold;
}

.login-form input {
  width: 100%;
  height: 58px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.2);
  background: #111827;
  color: white;
  font-size: 22px;
  text-align: center;
  outline: none;
  margin-bottom: 24px;
}

.login-form input:focus {
  border-color: #00d9ff;
  box-shadow: 0 0 18px rgba(0, 217, 255, 0.4);
}

button {
  border: none;
  cursor: pointer;
}

#startBtn {
  width: 230px;
  height: 64px;
  border-radius: 40px;
  color: white;
  font-size: 23px;
  font-weight: bold;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  transition: 0.2s;
}

#startBtn:hover {
  transform: scale(1.06);
  box-shadow: 0 0 25px rgba(0, 217, 255, 0.55);
}

.login-tip {
  margin-top: 24px;
  color: #94a3b8;
}

/* 遊戲畫面 */
#gameScreen {
  justify-content: center;
  align-items: flex-start;
  background:
    radial-gradient(circle at 20% 10%, rgba(0, 217, 255, 0.18), transparent 30%),
    radial-gradient(circle at 85% 35%, rgba(255, 214, 10, 0.12), transparent 25%),
    linear-gradient(180deg, #030712, #07111f);
}

.game-wrap {
  width: 760px;
  padding: 22px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.player {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #0ea5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

#playerName {
  font-size: 22px;
  font-weight: bold;
}

.player small {
  color: #00d9ff;
}

.stage {
  color: #ffd400;
  font-size: 28px;
  font-weight: bold;
}

.battle-card {
  position: relative;
  height: 620px;
  border-radius: 30px;
  overflow: hidden;
  background: #111827;
  border: 2px solid rgba(255,255,255,0.12);
  box-shadow: 0 0 35px rgba(0, 0, 0, 0.45);
}

#webcam {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  z-index: 1;
}

.battle-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(3,7,18,0.15), rgba(3,7,18,0.35)),
    radial-gradient(circle at center, transparent 35%, rgba(3,7,18,0.35));
  pointer-events: none;
}

.boss-area {
  position: absolute;
  top: 38px;
  right: 42px;
  text-align: center;
  z-index: 5;
}

.boss {
  font-size: 104px;
  filter: drop-shadow(0 0 24px rgba(255, 0, 80, 0.9));
}

.boss-name {
  margin-top: 4px;
  font-size: 14px;
  background: rgba(0,0,0,0.5);
  padding: 6px 12px;
  border-radius: 14px;
}

.pet {
  position: absolute;
  right: 55px;
  bottom: 75px;
  z-index: 5;
  font-size: 74px;
  filter: drop-shadow(0 0 18px rgba(0, 217, 255, 0.9));
}

#cameraStatus {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 6;
  padding: 10px 16px;
  border-radius: 16px;
  background: rgba(0,0,0,0.65);
  color: #00d9ff;
  font-weight: bold;
}

.guide {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 6;
  padding: 12px 24px;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.88);
  border: 2px solid #ff3355;
}

.panel {
  margin-top: 18px;
  padding: 24px;
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255,255,255,0.08);
}

.stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stats span {
  display: block;
  color: #7e91bd;
  font-size: 13px;
}

.stats strong {
  color: #ffd400;
  font-size: 28px;
}

#combo {
  text-align: center;
  color: #ffd400;
  font-size: 30px;
  font-weight: bold;
  margin: 12px 0;
  opacity: 0;
}

#combo.show {
  animation: pop 0.45s;
  opacity: 1;
}

.hp-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.hp-bar {
  width: 100%;
  height: 16px;
  background: #1e293b;
  border-radius: 20px;
  overflow: hidden;
}

#hpFill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #4ade80, #22d3ee);
  transition: 0.3s;
}

.extra-info {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  color: #facc15;
  font-size: 14px;
}

.test-tip {
  text-align: center;
  color: #94a3b8;
  margin-top: 12px;
  font-size: 13px;
}

.hit {
  animation: bossHit 0.35s;
}

.petAttack {
  animation: petJump 0.45s;
}

#hitEffect {
  position: absolute;
  top: 105px;
  right: 90px;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  opacity: 0;
  z-index: 7;
  background: radial-gradient(circle, #fff176, rgba(255, 100, 0, 0.55), transparent 70%);
  pointer-events: none;
}

#hitEffect.show {
  animation: explosion 0.5s;
}

#floatingText {
  position: absolute;
  top: 120px;
  right: 120px;
  z-index: 8;
  color: #ffd400;
  font-size: 36px;
  font-weight: bold;
  opacity: 0;
  text-shadow: 0 0 14px #ff6600;
}

#floatingText.show {
  animation: floatText 0.75s;
}

@keyframes bossHit {
  0% { transform: translateX(0) scale(1); }
  25% { transform: translateX(-16px) scale(1.12); filter: brightness(2); }
  50% { transform: translateX(16px) scale(1.12); filter: brightness(2); }
  100% { transform: translateX(0) scale(1); }
}

@keyframes petJump {
  0% { transform: translateY(0); }
  50% { transform: translateY(-48px) scale(1.2); }
  100% { transform: translateY(0); }
}

@keyframes explosion {
  0% { transform: scale(0.3); opacity: 1; }
  100% { transform: scale(2.3); opacity: 0; }
}

@keyframes floatText {
  0% { transform: translateY(20px) scale(0.8); opacity: 0; }
  40% { transform: translateY(0) scale(1.2); opacity: 1; }
  100% { transform: translateY(-55px) scale(1); opacity: 0; }
}

@keyframes pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); }
}
