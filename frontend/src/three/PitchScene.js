import * as THREE from 'three';
import { OPP_SCENE, SCENES } from '../data/squad';

const PITCH_L = 105, PITCH_W = 68;
const pctToWorld = (x, y) => ({ x: (x - 50) / 100 * PITCH_W, z: (y - 50) / 100 * PITCH_L });
const worldToPct = (wx, wz) => ({ x: wx / PITCH_W * 100 + 50, y: wz / PITCH_L * 100 + 50 });

const CAM_PRESETS = {
  broadcast: { az: 0, pol: 0.95, r: 105, tz: 6 },
  manager:   { az: 0, pol: 1.22, r: 62,  tz: 22 },
  top:       { az: 0, pol: 0.08, r: 130, tz: 0 },
};

const SKIN = 0xd9a06b;

function makePitchTexture() {
  const W = 1024, H = 1580;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  for (let i = 0; i < 11; i++) {
    g.fillStyle = i % 2 ? '#1d7c4d' : '#176a41';
    g.fillRect(0, i * H / 11, W, H / 11 + 1);
  }
  g.strokeStyle = 'rgba(255,255,255,.92)'; g.lineWidth = 5;
  const M = 36;
  g.strokeRect(M, M, W - 2 * M, H - 2 * M);
  g.beginPath(); g.moveTo(M, H / 2); g.lineTo(W - M, H / 2); g.stroke();
  g.beginPath(); g.arc(W / 2, H / 2, W * 0.115, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(W / 2, H / 2, 6, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
  const boxW = W * 0.60, boxH = H * 0.155, sixW = W * 0.30, sixH = H * 0.06;
  for (const top of [true, false]) {
    const y0 = top ? M : H - M;
    const dir = top ? 1 : -1;
    g.strokeRect(W / 2 - boxW / 2, top ? y0 : y0 - boxH, boxW, boxH);
    g.strokeRect(W / 2 - sixW / 2, top ? y0 : y0 - sixH, sixW, sixH);
    const spotY = y0 + dir * H * 0.104;
    g.beginPath(); g.arc(W / 2, spotY, 5, 0, Math.PI * 2); g.fill();
    g.beginPath();
    g.arc(W / 2, spotY, W * 0.115, top ? 0.35 : Math.PI + 0.35, top ? Math.PI - 0.35 : 2 * Math.PI - 0.35);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
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
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(9, 2.8, 1);
  sp.renderOrder = 999;
  return sp;
}

function makePlayerFigure({ jersey, shorts, socks, prime = false, height = 180 }) {
  const grp = new THREE.Group();
  const jerseyMat = new THREE.MeshStandardMaterial({
    color: prime ? 0xf2c14e : jersey, roughness: 0.6,
    emissive: prime ? 0xf2c14e : 0x000000, emissiveIntensity: prime ? 0.35 : 0,
  });
  const shortsMat = new THREE.MeshStandardMaterial({ color: prime ? 0xc79a2e : shorts, roughness: 0.7 });
  const sockMat = new THREE.MeshStandardMaterial({ color: socks, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1512, roughness: 0.8 });

  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.5, 8), sockMat);
    leg.position.set(s * 0.32, 0.75, 0); grp.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.72), hairMat);
    boot.position.set(s * 0.32, 0.11, 0.1); grp.add(boot);
  }
  const hip = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.58, 0.75, 10), shortsMat);
  hip.position.y = 1.85; grp.add(hip);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 1.5, 10), jerseyMat);
  torso.position.y = 2.95; grp.add(torso);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.25, 7), jerseyMat);
    arm.position.set(s * 0.78, 2.95, 0);
    arm.rotation.z = s * 0.28;
    grp.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 7), skinMat);
    hand.position.set(s * 0.95, 2.32, 0); grp.add(hand);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), skinMat);
  head.position.y = 4.05; grp.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.47, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.y = 4.12; grp.add(hair);
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
  const bodyScale = 0.9 + (height - 170) * 0.008;
  grp.scale.setScalar(bodyScale);
  grp.userData.jerseyMat = jerseyMat;
  grp.userData.bodyScale = bodyScale;
  return grp;
}

/**
 * PitchScene — Three.js 렌더링/입력을 캡슐화한 비-React 클래스.
 * React 컴포넌트는 ref로 canvas를 넘기고, 이 클래스가 씬을 소유한다.
 */
export class PitchScene {
  constructor(canvas, { onSelectPlayer, onDragPlayer } = {}) {
    this.canvas = canvas;
    this.onSelectPlayer = onSelectPlayer || (() => {});
    this.onDragPlayer = onDragPlayer || (() => {}); // (id, x%, y%)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04100a);
    this.scene.fog = new THREE.Fog(0x04100a, 160, 320);

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 600);
    this.cam = { az: 0, pol: 0.95, r: 105, target: new THREE.Vector3(0, 0, 6), minPol: 0.06, maxPol: 1.35, minR: 38, maxR: 170 };
    this.camAnim = null;
    this._applyCam();

    this.scene.add(new THREE.HemisphereLight(0xbfd8c8, 0x0a1a10, 0.55));
    const sun = new THREE.DirectionalLight(0xfff4d8, 1.15);
    sun.position.set(45, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
    sun.shadow.camera.far = 250;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8fb3ff, 0.25);
    fill.position.set(-40, 50, -60);
    this.scene.add(fill);

    this.playerMeshes = {};
    this.oppMeshes = [];
    this.zoneMeshes = [];
    this._buildStadium();

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.selected = null;
    this._dragKey = null;
    this._orbiting = false;
    this._lastPX = 0; this._lastPY = 0;

    this._bindInput();
    this.clock = new THREE.Clock();
    this._raf = requestAnimationFrame(this._tick);
  }

  // ---------- 스타디움 구성 ----------
  _buildStadium() {
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_W + 8, PITCH_L + 8),
      new THREE.MeshStandardMaterial({ map: makePitchTexture(), roughness: 0.85 })
    );
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    this.scene.add(grass);

    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_W + 56, PITCH_L + 56),
      new THREE.MeshStandardMaterial({ color: 0x0a1f14, roughness: 1 })
    );
    apron.rotation.x = -Math.PI / 2; apron.position.y = -0.05;
    apron.receiveShadow = true;
    this.scene.add(apron);

    const postMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.35 });
    const netMat = new THREE.MeshBasicMaterial({ color: 0xdddddd, wireframe: true, transparent: true, opacity: 0.35 });
    for (const zc of [-PITCH_L / 2, PITCH_L / 2]) {
      const dir = zc > 0 ? 1 : -1;
      const gw = 7.32, gh = 2.44, postR = 0.12;
      const goal = new THREE.Group();
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, gh, 8), postMat);
        post.position.set(s * gw / 2, gh / 2, 0); post.castShadow = true; goal.add(post);
      }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(postR, postR, gw, 8), postMat);
      bar.rotation.z = Math.PI / 2; bar.position.set(0, gh, 0); bar.castShadow = true; goal.add(bar);
      const net = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, 1.7, 8, 4, 3), netMat);
      net.position.set(0, gh / 2, dir * 0.9); goal.add(net);
      goal.position.z = zc;
      this.scene.add(goal);
    }

    const crowdTex = (() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = '#101c15'; g.fillRect(0, 0, 256, 128);
      for (let i = 0; i < 1600; i++) {
        g.fillStyle = `hsl(${Math.random() * 360},40%,${35 + Math.random() * 35}%)`;
        g.fillRect(Math.random() * 256, Math.random() * 128, 2, 2);
      }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 2);
      return t;
    })();
    const standMat = new THREE.MeshStandardMaterial({ map: crowdTex, roughness: 1 });
    const addStand = (w, x, z, rotY) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(w, 14, 16), standMat);
      s.position.set(x, 6.2, z);
      s.rotation.y = rotY;
      this.scene.add(s);
    };
    addStand(PITCH_W + 60, 0, -(PITCH_L / 2 + 22), 0);
    addStand(PITCH_W + 60, 0, (PITCH_L / 2 + 22), 0);
    addStand(PITCH_L + 18, -(PITCH_W / 2 + 22), 0, Math.PI / 2);
    addStand(PITCH_L + 18, (PITCH_W / 2 + 22), 0, Math.PI / 2);

    const towerMat = new THREE.MeshStandardMaterial({ color: 0x24312a, roughness: 0.9 });
    for (const [tx, tz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 30, 8), towerMat);
      pole.position.set(tx * (PITCH_W / 2 + 30), 15, tz * (PITCH_L / 2 + 30));
      this.scene.add(pole);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 1), new THREE.MeshBasicMaterial({ color: 0xf8ffe8 }));
      lamp.position.set(tx * (PITCH_W / 2 + 30), 30, tz * (PITCH_L / 2 + 30));
      lamp.lookAt(0, 0, 0);
      this.scene.add(lamp);
    }

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
    this.scene.add(this.ballMesh);
  }

  // ---------- 카메라 ----------
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
    const p = CAM_PRESETS[name];
    if (!p) return;
    this.camAnim = {
      from: { az: this.cam.az, pol: this.cam.pol, r: this.cam.r, tz: this.cam.target.z },
      to: { az: p.az, pol: p.pol, r: p.r, tz: targetZOverride ?? p.tz },
      t: 0,
    };
  }
  zoom(delta) {
    this.cam.r = Math.max(this.cam.minR, Math.min(this.cam.maxR, this.cam.r + delta));
    this._applyCam();
  }

  // ---------- 선수 전체 초기화(제거) ----------
  clearPlayers() {
    for (const k in this.playerMeshes) this.scene.remove(this.playerMeshes[k]);
    this.playerMeshes = {};
  }

  // ---------- 상대팀/존/공 리셋 (장면 전환 시) ----------
  resetOppAndZones(sceneKey) {
    this.oppMeshes.forEach(m => this.scene.remove(m));
    this.zoneMeshes.forEach(m => this.scene.remove(m));
    this.oppMeshes = []; this.zoneMeshes = [];
    this.scene.children.filter(o => o.userData.isZoneLabel).forEach(o => this.scene.remove(o));

    OPP_SCENE[sceneKey].forEach(o => {
      const fig = makePlayerFigure({
        jersey: o.gk ? 0x1c1c1c : 0xe0b23c, shorts: 0x1c6b3c, socks: o.gk ? 0x1c1c1c : 0xe0b23c, height: 181,
      });
      const w = pctToWorld(o.x, o.y);
      fig.position.set(w.x, 0, w.z);
      const lbl = makeLabel(o.name, 'RSA · ' + o.no, '#ffe9ad', 'rgba(40,28,4,.7)');
      lbl.position.y = 6.1;
      fig.add(lbl);
      this.scene.add(fig);
      this.oppMeshes.push(fig);
    });

    const sc = SCENES[sceneKey];
    for (const zdef of [sc.zoneMain, sc.zoneCross]) {
      const w = pctToWorld(zdef.x, zdef.y);
      const zone = new THREE.Mesh(
        new THREE.CircleGeometry(zdef.r, 40),
        new THREE.MeshBasicMaterial({ color: zdef.color, transparent: true, opacity: 0.3 })
      );
      zone.rotation.x = -Math.PI / 2;
      zone.position.set(w.x, 0.04, w.z);
      this.scene.add(zone); this.zoneMeshes.push(zone);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(zdef.r - 0.35, zdef.r, 48),
        new THREE.MeshBasicMaterial({ color: zdef.color, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(w.x, 0.05, w.z);
      this.scene.add(ring); this.zoneMeshes.push(ring);
      const zl = makeLabel(zdef.lbl, null, '#ffffff', 'rgba(0,0,0,.55)');
      zl.scale.set(11, 3.4, 1);
      zl.position.set(w.x, 3.2, w.z);
      zl.userData.isZoneLabel = true;
      this.scene.add(zl);
    }
    const bw = pctToWorld(sc.zoneMain.x, sc.zoneMain.y);
    this.ballMesh.position.set(bw.x, 0.55, bw.z);
    this.selectRing.visible = false;
    this.selected = null;
  }

  /** 편의 메서드: 장면 전체를 한번에 구성 (초기 로드 시 사용) */
  spawnAll(playersObj, sceneKey) {
    this.clearPlayers();
    for (const id in playersObj) this.spawnPlayer(id, playersObj[id]);
    this.resetOppAndZones(sceneKey);
  }

  spawnPlayer(id, p) {
    const gk = p.data.pref.includes('GK');
    const fig = makePlayerFigure({
      jersey: gk ? 0x111111 : 0x4f7df9, shorts: gk ? 0x222222 : 0x1f3fa8,
      socks: gk ? 0x111111 : 0x4f7df9, prime: p.prime, height: p.data.h,
    });
    const w = pctToWorld(p.x, p.y);
    fig.position.set(w.x, 0, w.z);
    fig.userData.key = id;
    fig.userData.prime = p.prime;
    fig.userData.tx = w.x; fig.userData.tz = w.z;
    const lbl = makeLabel(
      (p.prime ? '★ ' : '') + p.data.name,
      `NO.${p.data.no} · ${p.data.h}cm · ${p.prime ? 27 : p.data.age}세`,
      p.prime ? '#f2c14e' : '#ffffff'
    );
    lbl.position.y = 6.1 / (fig.userData.bodyScale || 1);
    fig.add(lbl);
    this.scene.add(fig);
    this.playerMeshes[id] = fig;
  }
  removePlayer(id) {
    if (this.playerMeshes[id]) { this.scene.remove(this.playerMeshes[id]); delete this.playerMeshes[id]; }
  }
  rebuildPlayer(id, p) {
    this.removePlayer(id);
    this.spawnPlayer(id, p);
  }
  movePlayerTarget(id, xPct, yPct) {
    const mesh = this.playerMeshes[id];
    if (!mesh) return;
    const w = pctToWorld(xPct, yPct);
    mesh.userData.tx = w.x; mesh.userData.tz = w.z;
  }
  setSelected(id) {
    this.selected = id;
    this.selectRing.visible = !!id;
  }

  // ---------- 입력 ----------
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
      ev.preventDefault();
      cv.setPointerCapture(ev.pointerId);
      this._lastPX = ev.clientX; this._lastPY = ev.clientY;
      const key = this._pickPlayer(ev);
      if (key) {
        this._dragKey = key;
        this.setSelected(key);
        this.onSelectPlayer(key);
      } else {
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
      } else if (this._orbiting) {
        this.cam.az -= dx * 0.005;
        this.cam.pol = Math.max(this.cam.minPol, Math.min(this.cam.maxPol, this.cam.pol - dy * 0.004));
        this.camAnim = null;
        this._applyCam();
      }
    };
    this._onUp = () => { this._dragKey = null; this._orbiting = false; cv.classList.remove('dragging'); };
    this._onWheel = (ev) => {
      ev.preventDefault();
      this.zoom(ev.deltaY * 0.06);
    };
    cv.addEventListener('pointerdown', this._onDown);
    cv.addEventListener('pointermove', this._onMove);
    cv.addEventListener('pointerup', this._onUp);
    cv.addEventListener('pointercancel', this._onUp);
    cv.addEventListener('wheel', this._onWheel, { passive: false });
  }

  // ---------- 프레임마다 드래그 중인 선수 위치를 실제로 반영 ----------
  syncPlayerWorldPos(id, xPct, yPct) {
    const mesh = this.playerMeshes[id];
    if (!mesh) return;
    const w = pctToWorld(xPct, yPct);
    mesh.position.x = w.x; mesh.position.z = w.z;
    mesh.userData.tx = w.x; mesh.userData.tz = w.z;
  }

  // ---------- 렌더 루프 ----------
  _tick = () => {
    this._raf = requestAnimationFrame(this._tick);
    const t = this.clock.getElapsedTime();
    this.zoneMeshes.forEach((z, i) => { z.material.opacity = 0.22 + 0.16 * Math.sin(t * 2.2 + i); });
    for (const k in this.playerMeshes) {
      const g = this.playerMeshes[k];
      if (g.userData.tx !== undefined) {
        g.position.x += (g.userData.tx - g.position.x) * 0.12;
        g.position.z += (g.userData.tz - g.position.z) * 0.12;
      }
      g.children.forEach(ch => {
        if (ch.userData.isAura) {
          ch.rotation.z = t * 1.2;
          ch.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
        }
      });
      if (g.userData.prime && g.userData.jerseyMat) {
        g.userData.jerseyMat.emissiveIntensity = 0.28 + 0.14 * Math.sin(t * 3);
      }
      g.position.y = (this.selected === k) ? Math.abs(Math.sin(t * 4)) * 0.25 : 0;
    }
    if (this.selectRing.visible && this.selected && this.playerMeshes[this.selected]) {
      const p = this.playerMeshes[this.selected].position;
      this.selectRing.position.x = p.x; this.selectRing.position.z = p.z;
      this.selectRing.rotation.z = t * 1.5;
    }
    if (this.camAnim) {
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
