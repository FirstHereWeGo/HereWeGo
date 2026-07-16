import * as THREE from 'three';

const PITCH_L = 105, PITCH_W = 68;
const pctToWorld = (x, y) => ({ x: (x - 50) / 100 * PITCH_W, z: (y - 50) / 100 * PITCH_L });
const worldToPct = (wx, wz) => ({ x: wx / PITCH_W * 100 + 50, y: wz / PITCH_L * 100 + 50 });

// 선수 스케일(≈2.5x 실물) 기준 골대: 키(≈4.7) + 머리 하나(≈0.8) ≈ 5.5, 폭은 실제 비율(×3)
const GOAL_H = 5.5;
const GOAL_W = GOAL_H * 3;

const CAM_PRESETS = {
  broadcast: { az: 0, pol: 0.95, r: 105, tz: 6 },
  top:       { az: 0, pol: 0.08, r: 130, tz: 0 },
};

const SKIN = 0xd9a06b;

// ================= 피치 텍스처 (실제 규격 라인) =================
function makePitchTexture() {
  const W = 1364, H = 2048;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');

  const M = 46; // 터치라인 여백(px)
  const pxX = (W - 2 * M) / PITCH_W;  // m → px (가로)
  const pxY = (H - 2 * M) / PITCH_L;  // m → px (세로)
  const mx = m => M + m * pxX;
  const my = m => M + m * pxY;

  // 잔디 스트라이프
  for (let i = 0; i < 12; i++) {
    g.fillStyle = i % 2 ? '#1e8050' : '#186f44';
    g.fillRect(0, i * H / 12, W, H / 12 + 1);
  }
  // 은은한 비네트
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.22)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);

  g.strokeStyle = 'rgba(255,255,255,.95)';
  g.lineWidth = 6;
  g.lineCap = 'round';

  // 외곽 / 하프라인
  g.strokeRect(mx(0), my(0), PITCH_W * pxX, PITCH_L * pxY);
  g.beginPath(); g.moveTo(mx(0), my(52.5)); g.lineTo(mx(68), my(52.5)); g.stroke();

  // 센터 서클(9.15m) + 센터 스팟
  g.beginPath();
  g.ellipse(mx(34), my(52.5), 9.15 * pxX, 9.15 * pxY, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath(); g.ellipse(mx(34), my(52.5), 5, 5, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();

  // 박스/스팟/아크 — 실제 규격
  const boxW = 40.32, boxD = 16.5, sixW = 18.32, sixD = 5.5, spotD = 11, arcR = 9.15;
  const halfAng = Math.acos((boxD - spotD) / arcR); // 아크가 박스 밖으로 나가는 각
  for (const top of [true, false]) {
    const yEdge = top ? 0 : 105;
    const dir = top ? 1 : -1;
    // 페널티 박스
    g.strokeRect(mx((68 - boxW) / 2), my(top ? 0 : 105 - boxD), boxW * pxX, boxD * pxY);
    // 6야드 박스
    g.strokeRect(mx((68 - sixW) / 2), my(top ? 0 : 105 - sixD), sixW * pxX, sixD * pxY);
    // 페널티 스팟
    const sy = my(yEdge + dir * spotD);
    g.beginPath(); g.ellipse(mx(34), sy, 4.5, 4.5, 0, 0, Math.PI * 2); g.fill();
    // 페널티 아크 — 박스 라인 밖 구간만 (겹침 버그 수정)
    const mid = top ? Math.PI / 2 : -Math.PI / 2; // 캔버스 각도(y가 아래로 +)
    g.beginPath();
    g.ellipse(mx(34), sy, arcR * pxX, arcR * pxY, 0, mid - halfAng, mid + halfAng);
    g.stroke();
  }

  // 코너 아크 (1m)
  const corners = [
    [0, 0, 0, Math.PI / 2], [68, 0, Math.PI / 2, Math.PI],
    [68, 105, Math.PI, Math.PI * 1.5], [0, 105, Math.PI * 1.5, Math.PI * 2],
  ];
  corners.forEach(([cxM, cyM, a0, a1]) => {
    g.beginPath();
    g.ellipse(mx(cxM), my(cyM), 1 * pxX, 1 * pxY, 0, a0, a1);
    g.stroke();
  });

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

// ================= 등번호 뱃지 =================
function makeNumberBadge(no, bg = '#d7261d', fg = '#ffffff') {
  const c = document.createElement('canvas'); c.width = 160; c.height = 160;
  const g = c.getContext('2d');
  g.beginPath(); g.arc(80, 80, 70, 0, Math.PI * 2);
  g.fillStyle = bg; g.fill();
  g.lineWidth = 8; g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke();
  g.fillStyle = fg;
  g.font = "900 78px 'Rajdhani','Noto Sans KR',sans-serif";
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(no), 80, 88);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(1.55, 1.55, 1);
  sp.renderOrder = 999;
  return sp;
}

function makeLabel(text, sub, color = '#ffffff', bg = 'rgba(4,16,10,.72)') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  const r = 28, w = 512, h = sub ? 160 : 110;
  g.beginPath();
  g.moveTo(r, 0); g.lineTo(w - r, 0); g.arc(w - r, r, r, -Math.PI / 2, 0);
  g.lineTo(w, h - r); g.arc(w - r, h - r, r, 0, Math.PI / 2);
  g.lineTo(r, h); g.arc(r, h - r, r, Math.PI / 2, Math.PI);
  g.lineTo(0, r); g.arc(r, r, r, Math.PI, -Math.PI / 2);
  g.fill();
  g.textAlign = 'center'; g.fillStyle = color;
  g.font = "900 60px 'Noto Sans KR', sans-serif";
  g.fillText(text, 256, sub ? 74 : 76);
  if (sub) {
    g.font = "700 38px 'Rajdhani','Noto Sans KR',sans-serif";
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.fillText(sub, 256, 132);
  }
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(9, 2.8, 1);
  sp.renderOrder = 999;
  return sp;
}

// ================= 선수 피규어 (운동선수 체형) =================
function makePlayerFigure({ jersey, shorts, socks, prime = false, height = 180 }) {
  const grp = new THREE.Group();
  const jerseyMat = new THREE.MeshStandardMaterial({
    color: prime ? 0xf2c14e : jersey, roughness: 0.55,
    emissive: prime ? 0xf2c14e : 0x000000, emissiveIntensity: prime ? 0.35 : 0,
  });
  const shortsMat = new THREE.MeshStandardMaterial({ color: prime ? 0x8a6a1c : shorts, roughness: 0.7 });
  const sockMat = new THREE.MeshStandardMaterial({ color: socks, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x181210, roughness: 0.85 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.5 });

  for (const s of [-1, 1]) {
    // 축구화 / 종아리(스타킹) / 허벅지 — 위가 굵고 아래가 얇은 하체
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.78), bootMat);
    boot.position.set(s * 0.34, 0.11, 0.10); grp.add(boot);
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.95, 8), sockMat);
    calf.position.set(s * 0.34, 0.72, 0); grp.add(calf);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.21, 0.95, 8), shortsMat);
    thigh.position.set(s * 0.33, 1.66, 0); grp.add(thigh);
  }
  // 골반(쇼츠) → 허리 → 가슴으로 갈수록 넓어지는 V 실루엣
  const hip = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.52, 0.55, 10), shortsMat);
  hip.position.y = 2.32; grp.add(hip);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.46, 1.32, 10), jerseyMat);
  torso.position.y = 3.28; grp.add(torso);
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.27, 9, 9), jerseyMat);
    shoulder.position.set(s * 0.62, 3.86, 0); grp.add(shoulder);
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.78, 7), jerseyMat);
    upperArm.position.set(s * 0.82, 3.42, 0);
    upperArm.rotation.z = s * 0.30;
    grp.add(upperArm);
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.11, 0.68, 7), skinMat);
    forearm.position.set(s * 1.00, 2.80, 0.05);
    forearm.rotation.z = s * 0.16;
    grp.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 7), skinMat);
    hand.position.set(s * 1.07, 2.44, 0.08); grp.add(hand);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.26, 8), skinMat);
  neck.position.y = 4.04; grp.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.40, 12, 12), skinMat);
  head.position.y = 4.44; grp.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
  hair.position.y = 4.52; grp.add(hair);
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; });

  if (prime) {
    const aura = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.7, 32),
      new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    aura.rotation.x = -Math.PI / 2; aura.position.y = 0.06;
    aura.userData.isAura = true;
    grp.add(aura);
  }
  const bodyScale = 0.86 + (height - 170) * 0.008;
  grp.scale.setScalar(bodyScale);
  grp.userData.jerseyMat = jerseyMat;
  grp.userData.bodyScale = bodyScale;
  return grp;
}

/** 감독/코치 — 정장 피규어 */
function makeStaffFigure({ suit = 0x1a2440, height = 178 }) {
  const grp = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({ color: suit, roughness: 0.75 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.6 });
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.85 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5 });

  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 2.0, 8), suitMat);
    leg.position.set(s * 0.30, 1.0, 0); grp.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.7), shoeMat);
    shoe.position.set(s * 0.30, 0.1, 0.1); grp.add(shoe);
  }
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.48, 1.55, 10), suitMat);
  torso.position.y = 2.85; grp.add(torso);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.40, 0.35, 8), shirtMat);
  collar.position.y = 3.62; grp.add(collar);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.35, 7), suitMat);
    arm.position.set(s * 0.78, 2.85, 0);
    arm.rotation.z = s * 0.22;
    grp.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 7), skinMat);
    hand.position.set(s * 0.95, 2.18, 0); grp.add(hand);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), skinMat);
  head.position.y = 4.05; grp.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
  hair.position.y = 4.14; grp.add(hair);
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; });
  grp.scale.setScalar(0.9 + (height - 170) * 0.008);
  return grp;
}

const KIT = {
  kor:   { jersey: 0xd7261d, shorts: 0x111111, socks: 0xd7261d },
  korGk: { jersey: 0x9aa0a6, shorts: 0x1a1a1a, socks: 0x9aa0a6 },
  rsa:   { jersey: 0xf2c94c, shorts: 0x1d7a3f, socks: 0xf2c94c },
  rsaGk: { jersey: 0x17171c, shorts: 0x17171c, socks: 0x17171c },
};

export class PitchScene {
  constructor(canvas, { onSelectPlayer, onDragPlayer } = {}) {
    this.canvas = canvas;
    this.onSelectPlayer = onSelectPlayer || (() => {});
    this.onDragPlayer = onDragPlayer || (() => {});

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // BBC 3D 스타일 — 짙은 무채색 공간에 피치만 떠 있는 연출
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090b);
    this.scene.fog = new THREE.Fog(0x07090b, 220, 420);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 800);
    this.cam = { az: 0, pol: 0.95, r: 105, target: new THREE.Vector3(0, 0, 6), minPol: 0.06, maxPol: 1.35, minR: 38, maxR: 190 };
    this.camMode = 'orbit';
    this.camAnim = null;
    this._applyCam();

    this.scene.add(new THREE.HemisphereLight(0xcfe3d6, 0x0a0f0c, 0.5));
    const sun = new THREE.DirectionalLight(0xfff4d8, 1.2);
    sun.position.set(45, 90, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
    sun.shadow.camera.far = 280;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8fb3ff, 0.22);
    fill.position.set(-40, 50, -60);
    this.scene.add(fill);

    this.playerMeshes = {};
    this.oppMeshes = [];
    this.flashMeshes = [];
    this.editable = true;
    this.liveAmbient = false;
    this._ambient = { carrier: null, carrierIsKor: true, nextPassAt: 0 };
    this._teamShift = 0;
    this._buildWorld();

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.selected = null;
    this._dragKey = null;
    this._orbiting = false;
    this._lastPX = 0; this._lastPY = 0;
    this._script = null;

    this._bindInput();
    this.clock = new THREE.Clock();
    this._raf = requestAnimationFrame(this._tick);
  }

  // ================= 월드 (떠 있는 피치) =================
  _buildWorld() {
    // 잔디
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_W + 8, PITCH_L + 8),
      new THREE.MeshStandardMaterial({ map: makePitchTexture(), roughness: 0.85 })
    );
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    this.scene.add(grass);

    // 피치를 '떠 있는 슬래브'처럼 보이게 하는 얇은 옆면
    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(PITCH_W + 8, 1.6, PITCH_L + 8),
      new THREE.MeshStandardMaterial({ color: 0x0b1410, roughness: 0.9 })
    );
    skirt.position.y = -0.82;
    this.scene.add(skirt);

    // 골대 (확장 규격)
    const postMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });
    const netMat = new THREE.MeshBasicMaterial({ color: 0xe8e8e8, wireframe: true, transparent: true, opacity: 0.30 });
    for (const zc of [-PITCH_L / 2, PITCH_L / 2]) {
      const dir = zc > 0 ? 1 : -1;
      const postR = 0.17;
      const goal = new THREE.Group();
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, GOAL_H, 10), postMat);
        post.position.set(s * GOAL_W / 2, GOAL_H / 2, 0); post.castShadow = true; goal.add(post);
      }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, GOAL_W, 10), postMat);
      bar.rotation.z = Math.PI / 2; bar.position.set(0, GOAL_H, 0); bar.castShadow = true; goal.add(bar);
      const net = new THREE.Mesh(new THREE.BoxGeometry(GOAL_W, GOAL_H, 3.0, 12, 7, 4), netMat);
      net.position.set(0, GOAL_H / 2, dir * 1.6); goal.add(net);
      // 뒷그물 지지대
      for (const s of [-1, 1]) {
        const stay = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, GOAL_H * 1.15, 6), postMat);
        stay.position.set(s * GOAL_W / 2, GOAL_H / 2 - 0.3, dir * 1.5);
        stay.rotation.x = dir * 0.5;
        goal.add(stay);
      }
      goal.position.z = zc;
      this.scene.add(goal);
    }

    // 테크니컬 에어리어 (떠 있는 플랫폼 + 더그아웃 + 감독)
    this._buildTechnicalArea();

    // 선택 링 / 공
    this.selectRing = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.55, 32),
      new THREE.MeshBasicMaterial({ color: 0x34e07a, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    this.selectRing.rotation.x = -Math.PI / 2; this.selectRing.position.y = 0.07;
    this.selectRing.visible = false;
    this.scene.add(this.selectRing);

    this.ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    this.ballMesh.castShadow = true;
    this.ballMesh.position.set(0, 0.55, 0);
    this.scene.add(this.ballMesh);
  }

  _buildTechnicalArea() {
    const sideX = -(PITCH_W / 2 + 8);
    // 떠 있는 플랫폼
    const plat = new THREE.Mesh(
      new THREE.BoxGeometry(9, 1.2, 56),
      new THREE.MeshStandardMaterial({ color: 0x10151a, roughness: 0.85 })
    );
    plat.position.set(sideX, -0.6, 0);
    this.scene.add(plat);

    const buildDugout = (cz, seatColor, suit, managerName, managerZ) => {
      const g = new THREE.Group();
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x161d22, roughness: 0.5, metalness: 0.3 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x2a3844, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.45 });
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.0, 13), glassMat);
      back.position.set(-2.4, 1.5, 0); g.add(back);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 13.6), frameMat);
      roof.position.set(-0.7, 3.1, 0); g.add(roof);
      for (const s of [-1, 1]) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.0, 0.3), glassMat);
        wall.position.set(-0.7, 1.5, s * 6.8); g.add(wall);
      }
      const seatMat = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.45 });
      for (let i = 0; i < 5; i++) {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.35), seatMat);
        seat.position.set(-1.1, 0.85, -4.5 + i * 2.25);
        g.add(seat);
      }
      for (let i = 0; i < 3; i++) {
        const coach = makeStaffFigure({ suit, height: 175 });
        coach.scale.multiplyScalar(0.88);
        coach.position.set(-1.1, 0.55, -2.3 + i * 2.25);
        g.add(coach);
      }
      g.position.set(sideX, 0, cz);
      this.scene.add(g);

      // 감독 — 테크니컬 에어리어 앞 라인
      const manager = makeStaffFigure({ suit, height: 180 });
      manager.position.set(sideX + 3.4, 0, managerZ);
      manager.rotation.y = Math.PI / 2;
      const lbl = makeLabel(managerName, '감독', '#f2c14e', 'rgba(16,12,4,.8)');
      lbl.position.y = 5.6;
      manager.add(lbl);
      this.scene.add(manager);
      return manager;
    };
    this.managerKor = buildDugout(19, 0xb32720, 0x1a2440, '홍명보', 13);
    this.managerRsa = buildDugout(-19, 0xc7a02e, 0x2e2a20, '브루스', -13);
  }

  // ================= 카메라 =================
  _applyCam() {
    const t = this.cam.target;
    this.camera.position.set(
      t.x + this.cam.r * Math.sin(this.cam.pol) * Math.sin(this.cam.az),
      t.y + this.cam.r * Math.cos(this.cam.pol),
      t.z + this.cam.r * Math.sin(this.cam.pol) * Math.cos(this.cam.az)
    );
    this.camera.lookAt(t);
  }
  setCamPreset(name, targetZOverride) {
    if (name === 'manager') { this.camMode = 'managerFP'; return; }
    this.camMode = 'orbit';
    const p = CAM_PRESETS[name];
    if (!p) return;
    this.camAnim = {
      from: { az: this.cam.az, pol: this.cam.pol, r: this.cam.r, tz: this.cam.target.z },
      to: { az: p.az, pol: p.pol, r: p.r, tz: targetZOverride ?? p.tz },
      t: 0,
    };
  }
  zoom(delta) {
    if (this.camMode !== 'orbit') return;
    this.cam.r = Math.max(this.cam.minR, Math.min(this.cam.maxR, this.cam.r + delta));
    this._applyCam();
  }

  // ================= 선수 =================
  spawnPlayer(id, p) {
    const gk = p.data.pref.includes('GK');
    const kit = gk ? KIT.korGk : KIT.kor;
    const fig = makePlayerFigure({ ...kit, prime: p.prime, height: p.data.h });
    const w = pctToWorld(p.x, p.y);
    fig.position.set(w.x, 0, w.z);
    fig.userData.key = id;
    fig.userData.prime = p.prime;
    fig.userData.isKor = true;
    fig.userData.tx = w.x; fig.userData.tz = w.z;
    fig.userData.wanderPhase = Math.random() * Math.PI * 2;
    // 머리 위 UI — 등번호만
    const badge = makeNumberBadge(p.data.no, p.prime ? '#f2c14e' : '#d7261d');
    badge.position.y = 5.5 / (fig.userData.bodyScale || 1);
    fig.add(badge);
    this.scene.add(fig);
    this.playerMeshes[id] = fig;
  }
  removePlayer(id) {
    if (this.playerMeshes[id]) { this.scene.remove(this.playerMeshes[id]); delete this.playerMeshes[id]; }
  }
  rebuildPlayer(id, p) { this.removePlayer(id); this.spawnPlayer(id, p); }
  movePlayerTarget(id, xPct, yPct) {
    const mesh = this.playerMeshes[id];
    if (!mesh) return;
    const w = pctToWorld(xPct, yPct);
    mesh.userData.tx = w.x; mesh.userData.tz = w.z;
  }
  clearPlayers() {
    for (const k in this.playerMeshes) this.scene.remove(this.playerMeshes[k]);
    this.playerMeshes = {};
  }
  syncPlayerWorldPos(id, xPct, yPct) {
    const mesh = this.playerMeshes[id];
    if (!mesh) return;
    const w = pctToWorld(xPct, yPct);
    mesh.position.x = w.x; mesh.position.z = w.z;
    mesh.userData.tx = w.x; mesh.userData.tz = w.z;
  }
  setSelected(id) {
    this.selected = id;
    this.selectRing.visible = !!id;
  }

  spawnOpp(oppList) {
    this.oppMeshes.forEach(m => this.scene.remove(m));
    this.oppMeshes = [];
    oppList.forEach(o => {
      const kit = o.gk ? KIT.rsaGk : KIT.rsa;
      const fig = makePlayerFigure({ ...kit, height: 181 });
      const w = pctToWorld(o.x, o.y);
      fig.position.set(w.x, 0, w.z);
      fig.userData.isKor = false;
      fig.userData.tx = w.x; fig.userData.tz = w.z;
      fig.userData.wanderPhase = Math.random() * Math.PI * 2;
      const badge = makeNumberBadge(o.no, '#e0b23c', '#1c1c1c');
      badge.position.y = 5.5;
      fig.add(badge);
      this.scene.add(fig);
      this.oppMeshes.push(fig);
    });
  }
  swapOppPlayer(index, newName, newNo) {
    const mesh = this.oppMeshes[index];
    if (!mesh) return;
    const old = mesh.children.find(c => c.isSprite);
    if (old) mesh.remove(old);
    const badge = makeNumberBadge(newNo, '#e0b23c', '#1c1c1c');
    badge.position.y = 5.5;
    mesh.add(badge);
  }
  resetBallCenter() {
    this.ballMesh.position.set(0, 0.55, 0);
    this._ambient.carrier = null;
    this._teamShift = 0;
  }

  flashZones(zones, color = 0x34e07a) {
    this.clearFlash();
    for (const z of [zones.cross, zones.target]) {
      const w = pctToWorld(z.x, z.y);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(5.5, 6.2, 48),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(w.x, 0.05, w.z);
      this.scene.add(ring);
      this.flashMeshes.push(ring);
    }
  }
  clearFlash() {
    this.flashMeshes.forEach(m => this.scene.remove(m));
    this.flashMeshes = [];
  }

  // ================= 입력 =================
  _pick(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera({ x: nx, y: ny }, this.camera);
    return this.raycaster;
  }
  _pickPlayer(ev) {
    const ray = this._pick(ev);
    const hits = ray.intersectObjects(Object.values(this.playerMeshes), true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.key) o = o.parent;
      if (o) return o.userData.key;
    }
    return null;
  }
  _pickGround(ev) {
    const ray = this._pick(ev);
    const pt = new THREE.Vector3();
    ray.ray.intersectPlane(this.groundPlane, pt);
    return pt;
  }
  _bindInput() {
    const cv = this.canvas;
    this._onDown = (ev) => {
      if (this._script || this.camMode === 'managerFP') return;
      ev.preventDefault();
      cv.setPointerCapture(ev.pointerId);
      this._lastPX = ev.clientX; this._lastPY = ev.clientY;
      const key = this.editable ? this._pickPlayer(ev) : null;
      if (key) {
        this._dragKey = key;
        this.setSelected(key);
        this.onSelectPlayer(key);
      } else {
        const viewKey = !this.editable ? this._pickPlayer(ev) : null;
        if (viewKey) { this.setSelected(viewKey); this.onSelectPlayer(viewKey); }
        this._orbiting = true;
        cv.classList.add('dragging');
      }
    };
    this._onMove = (ev) => {
      const dx = ev.clientX - this._lastPX, dy = ev.clientY - this._lastPY;
      this._lastPX = ev.clientX; this._lastPY = ev.clientY;
      if (this._dragKey) {
        const pt = this._pickGround(ev);
        if (!pt) return;
        const pct = worldToPct(pt.x, pt.z);
        this.onDragPlayer(this._dragKey, pct.x, pct.y);
      } else if (this._orbiting && this.camMode === 'orbit') {
        this.cam.az -= dx * 0.005;
        this.cam.pol = Math.max(this.cam.minPol, Math.min(this.cam.maxPol, this.cam.pol - dy * 0.004));
        this.camAnim = null;
        this._applyCam();
      }
    };
    this._onUp = () => { this._dragKey = null; this._orbiting = false; cv.classList.remove('dragging'); };
    this._onWheel = (ev) => { ev.preventDefault(); this.zoom(ev.deltaY * 0.06); };
    cv.addEventListener('pointerdown', this._onDown);
    cv.addEventListener('pointermove', this._onMove);
    cv.addEventListener('pointerup', this._onUp);
    cv.addEventListener('pointercancel', this._onUp);
    cv.addEventListener('wheel', this._onWheel, { passive: false });
  }

  // ================= 시퀀스 재생 =================
  playSequence(sequence, korIds, { onComplete, followBall = true } = {}) {
    this._dragKey = null; this._orbiting = false;
    this.canvas.classList.remove('dragging');
    this.setSelected(null);
    this._script = {
      keyframes: sequence.keyframes,
      ballKeyframes: sequence.ballKeyframes,
      totalSeconds: sequence.totalSeconds,
      startTime: this.clock.getElapsedTime(),
      korIds,
      onComplete: onComplete || (() => {}),
      followBall,
    };
  }
  stopSequence() { this._script = null; }
  _bracket(list, t) {
    for (let i = 0; i < list.length - 1; i++) {
      if (t >= list[i].t && t <= list[i + 1].t) return [list[i], list[i + 1]];
    }
    return [list[list.length - 2], list[list.length - 1]];
  }
  returnToAnchors(korPlayers, oppList) {
    for (const id in korPlayers) {
      this.movePlayerTarget(id, korPlayers[id].x, korPlayers[id].y);
    }
    oppList.forEach((o, i) => {
      const mesh = this.oppMeshes[i];
      if (!mesh) return;
      const w = pctToWorld(o.x, o.y);
      mesh.userData.tx = w.x; mesh.userData.tz = w.z;
    });
  }

  // ================= 렌더 루프 =================
  _tick = () => {
    this._raf = requestAnimationFrame(this._tick);
    const t = this.clock.getElapsedTime();
    const dt = Math.min(0.05, this.clock.getDelta());

    if (this._script) {
      const s = this._script;
      const progress = Math.min(1, (t - s.startTime) / s.totalSeconds);
      const [kfA, kfB] = this._bracket(s.keyframes, progress);
      const span = kfB.t - kfA.t || 1;
      const lt = Math.max(0, Math.min(1, (progress - kfA.t) / span));

      s.korIds.forEach(id => {
        const pa = kfA.kor[id], pb = kfB.kor[id];
        if (!pa || !pb) return;
        const w = pctToWorld(pa.x + (pb.x - pa.x) * lt, pa.y + (pb.y - pa.y) * lt);
        const mesh = this.playerMeshes[id];
        if (mesh) { mesh.position.x = w.x; mesh.position.z = w.z; mesh.userData.tx = w.x; mesh.userData.tz = w.z; }
      });
      kfA.opp.forEach((oa, i) => {
        const ob = kfB.opp[i];
        if (!ob) return;
        const w = pctToWorld(oa.x + (ob.x - oa.x) * lt, oa.y + (ob.y - oa.y) * lt);
        const mesh = this.oppMeshes[i];
        if (mesh) { mesh.position.x = w.x; mesh.position.z = w.z; mesh.userData.tx = w.x; mesh.userData.tz = w.z; }
      });

      const [ba, bb] = this._bracket(s.ballKeyframes, progress);
      const bSpan = bb.t - ba.t || 1;
      const blt = Math.max(0, Math.min(1, (progress - ba.t) / bSpan));
      const bx = ba.x + (bb.x - ba.x) * blt, by = ba.y + (bb.y - ba.y) * blt, bh = ba.h + (bb.h - ba.h) * blt;
      const bw = pctToWorld(bx, by);
      this.ballMesh.position.set(bw.x, 0.55 + bh, bw.z);

      if (s.followBall && this.camMode === 'orbit') {
        this.cam.target.x += (bw.x - this.cam.target.x) * 0.06;
        this.cam.target.z += (bw.z - this.cam.target.z) * 0.06;
        this.camAnim = null;
        this._applyCam();
      }
      if (progress >= 1) {
        const cb = s.onComplete;
        this._script = null;
        cb();
      }
    } else {
      // 점유 팀 방향으로 전체 진형이 서서히 밀리는 영토 연출
      const shiftTarget = this.liveAmbient && this._ambient.carrier
        ? (this._ambient.carrierIsKor ? -3.2 : 3.2)
        : 0;
      this._teamShift += (shiftTarget - this._teamShift) * 0.02;

      for (const k in this.playerMeshes) {
        const g = this.playerMeshes[k];
        if (g.userData.tx === undefined) continue;
        let ox = 0, oz = this._teamShift;
        if (this.liveAmbient) {
          const ph = g.userData.wanderPhase;
          ox += Math.sin(t * 0.7 + ph) * 1.1;
          oz += Math.cos(t * 0.55 + ph * 1.3) * 1.1;
        }
        g.position.x += (g.userData.tx + ox - g.position.x) * 0.06;
        g.position.z += (g.userData.tz + oz - g.position.z) * 0.06;
      }
      this.oppMeshes.forEach(g => {
        if (g.userData.tx === undefined) return;
        let ox = 0, oz = this._teamShift;
        if (this.liveAmbient) {
          const ph = g.userData.wanderPhase;
          ox += Math.sin(t * 0.65 + ph) * 1.1;
          oz += Math.cos(t * 0.5 + ph * 1.2) * 1.1;
        }
        g.position.x += (g.userData.tx + ox - g.position.x) * 0.06;
        g.position.z += (g.userData.tz + oz - g.position.z) * 0.06;
      });
      if (this.liveAmbient) {
        if (t > this._ambient.nextPassAt) {
          this._ambient.nextPassAt = t + 1.6 + Math.random() * 1.6;
          const korList = Object.values(this.playerMeshes);
          const keepTeam = Math.random() < 0.62;
          const curKor = this._ambient.carrierIsKor;
          const nextKor = this._ambient.carrier ? (keepTeam ? curKor : !curKor) : Math.random() < 0.5;
          const list = nextKor ? korList : this.oppMeshes;
          if (list.length) {
            this._ambient.carrier = list[Math.floor(Math.random() * list.length)];
            this._ambient.carrierIsKor = nextKor;
          }
        }
        if (this._ambient.carrier) {
          const cpos = this._ambient.carrier.position;
          this.ballMesh.position.x += (cpos.x - this.ballMesh.position.x) * dt * 3.2;
          this.ballMesh.position.z += (cpos.z + 0.9 - this.ballMesh.position.z) * dt * 3.2;
          this.ballMesh.position.y += (0.55 - this.ballMesh.position.y) * dt * 4;
          this.ballMesh.rotation.x += dt * 6;
        }
      }
    }

    for (const k in this.playerMeshes) {
      const g = this.playerMeshes[k];
      g.children.forEach(ch => {
        if (ch.userData.isAura) {
          ch.rotation.z = t * 1.2;
          ch.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
        }
      });
      if (g.userData.prime && g.userData.jerseyMat) {
        g.userData.jerseyMat.emissiveIntensity = 0.28 + 0.14 * Math.sin(t * 3);
      }
      g.position.y = (!this._script && this.selected === k) ? Math.abs(Math.sin(t * 4)) * 0.25 : 0;
    }
    if (!this._script && this.selectRing.visible && this.selected && this.playerMeshes[this.selected]) {
      const p = this.playerMeshes[this.selected].position;
      this.selectRing.position.x = p.x; this.selectRing.position.z = p.z;
      this.selectRing.rotation.z = t * 1.5;
    }
    this.flashMeshes.forEach((m, i) => { m.material.opacity = 0.45 + 0.35 * Math.sin(t * 5 + i); });

    if (this.camMode === 'managerFP' && this.managerKor) {
      const mp = this.managerKor.position;
      const eye = new THREE.Vector3(mp.x + 0.4, 4.4, mp.z);
      eye.y += Math.sin(t * 1.7) * 0.06;
      this.camera.position.lerp(eye, 0.12);
      const look = this.ballMesh.position.clone();
      look.y = Math.max(0.8, look.y);
      if (!this._fpLook) this._fpLook = look.clone();
      this._fpLook.lerp(look, 0.08);
      this.camera.lookAt(this._fpLook);
      const angle = Math.atan2(look.x - mp.x, look.z - mp.z);
      this.managerKor.rotation.y += (angle - this.managerKor.rotation.y) * 0.05;
    } else if (this.camAnim) {
      this.camAnim.t = Math.min(1, this.camAnim.t + 0.035);
      const e = 1 - Math.pow(1 - this.camAnim.t, 3);
      this.cam.az = this.camAnim.from.az + (this.camAnim.to.az - this.camAnim.from.az) * e;
      this.cam.pol = this.camAnim.from.pol + (this.camAnim.to.pol - this.camAnim.from.pol) * e;
      this.cam.r = this.camAnim.from.r + (this.camAnim.to.r - this.camAnim.from.r) * e;
      this.cam.target.z = this.camAnim.from.tz + (this.camAnim.to.tz - this.camAnim.from.tz) * e;
      this._applyCam();
      if (this.camAnim.t >= 1) this.camAnim = null;
    }

    this.renderer.render(this.scene, this.camera);
  };

  resize() {
    const wrap = this.canvas.parentElement;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    const cv = this.canvas;
    cv.removeEventListener('pointerdown', this._onDown);
    cv.removeEventListener('pointermove', this._onMove);
    cv.removeEventListener('pointerup', this._onUp);
    cv.removeEventListener('pointercancel', this._onUp);
    cv.removeEventListener('wheel', this._onWheel);
    this.renderer.dispose();
  }
}
