import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GROUPS, type PlantGroup, type PlantParams } from "./taxonomy";
import {
  TAU,
  buildAggregateFruit,
  buildFlower,
  buildRoots,
  buildSeed,
  buildStrobilus,
  clamp,
  ease,
  fruitGeometry,
  isRadialLeaf,
  leafGeometry,
  mulberry32,
  smoothstep,
  softSprite,
  stemCurve,
  taperedTube,
} from "./parts";
import { barkTexture, groundTexture, leafTexture, mix, seedTexture, shade } from "./textures";

export type Anchor = {
  id: string;
  /** 多语言标注键（见 content-i18n.ts） */
  key: string;
  label: string;
  sub: string;
  node: THREE.Object3D;
  from: number;
  to: number;
};

export type PlantModel = {
  group: THREE.Group;
  anchors: Anchor[];
  focusY: number;
  focusR: number;
  releaseColor: string;
  /** wind 每帧由视口传入，避免为一次风力调整重建整株模型 */
  update(g: number, time: number, wind?: number): void;
  dispose(): void;
};

type Win = [number, number];
const prog = (g: number, w: Win) => clamp((g - w[0]) / Math.max(1e-5, w[1] - w[0]), 0, 1);

type LeafNode = {
  pivot: THREE.Group;
  swing: THREE.Group;
  win: Win;
  phase: number;
  fold: number;
  twist: number;
  sori?: { mesh: THREE.Mesh; win: Win }[];
  colorMat?: THREE.MeshStandardMaterial;
  baseColor?: THREE.Color;
  autumnColor?: THREE.Color;
};
type TubeNode = { mesh: THREE.Mesh; win: Win; rings: number; radial: number; phase: number };
type ReproNode = {
  pivot: THREE.Group;
  winBud: Win;
  winBloom: Win;
  petals: THREE.Object3D[];
  stamens: THREE.Object3D[];
  antherMat?: THREE.MeshStandardMaterial;
  antherStart?: THREE.Color;
  antherRipe?: THREE.Color;
  budScale?: THREE.Object3D;
  pistil?: THREE.Object3D;
  phase: number;
  fruit?: { obj: THREE.Object3D; win: Win; mat?: THREE.MeshStandardMaterial; unripe?: THREE.Color; ripe?: THREE.Color };
  cone?: { obj: THREE.Group; pivots: THREE.Group[]; win: Win; female: boolean };
};

/* ------------------------------------------------------------------ */
export function buildPlant(p: PlantParams, grp: PlantGroup): PlantModel {
  const rnd = mulberry32(p.seed);
  const caps = grp.caps;
  const disposables: { dispose(): void }[] = [];
  const world = new THREE.Group();
  world.name = "specimen";
  const root = new THREE.Group();
  root.name = "plant";
  world.add(root);

  const groupScale =
    grp.id === "moss" ? 0.5 : grp.id === "gymno" ? 1.22 : grp.id === "algae" ? 0.95 : 1;
  const H = 2.35 * p.height * groupScale;
  const stemR =
    (0.028 + 0.05 * p.thickness) *
    (0.72 + 0.75 * p.woodiness) *
    (grp.id === "moss" ? 0.5 : grp.id === "gymno" ? 1.5 : 1);

  const herbGreen = mix("#6fa63f", "#7d5a35", p.woodiness);
  const stemCol = mix(herbGreen, p.stemColor, 0.55);
  const woody = p.woodiness > 0.45;
  const stemMat = new THREE.MeshStandardMaterial({
    ...(woody ? { map: barkTexture(stemCol) } : {}),
    color: woody ? 0xffffff : new THREE.Color(stemCol),
    roughness: 0.55 + 0.35 * p.woodiness,
  });
  disposables.push(stemMat);

  /* ---------------- 地面 / 基质 ---------------- */
  const ground = new THREE.Group();
  {
    const kind = p.ground;
    if (kind === "water") {
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(2.75, 2.55, 0.62, 56, 1, false),
        new THREE.MeshStandardMaterial({
          map: groundTexture("rock"),
          color: 0x9fb4b0,
          roughness: 0.9,
        }),
      );
      bowl.position.y = -0.45;
      bowl.receiveShadow = true;
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(2.62, 2.5, 0.95, 56, 1, false),
        new THREE.MeshStandardMaterial({
          map: groundTexture("water"),
          color: 0x9fd8e0,
          transparent: true,
          opacity: 0.42,
          roughness: 0.12,
          metalness: 0.1,
          depthWrite: false,
        }),
      );
      water.position.y = 0.06;
      water.renderOrder = 3;
      ground.add(bowl, water);
      disposables.push(bowl.geometry, (bowl.material as THREE.Material), water.geometry, water.material as THREE.Material);
    } else {
      // 半透明基质柱（根箱 / rhizotron）——便于观察地下部分：直根系、须根系或假根
      const depth = kind === "rock" ? 0.85 : 1.5;
      const R = kind === "rock" ? 2.15 : 2.55;
      const mat = new THREE.MeshStandardMaterial({
        map: groundTexture(kind),
        roughness: 1,
        color: kind === "rock" ? 0xa8b0a4 : 0xbda98f,
        transparent: true,
        opacity: kind === "rock" ? 0.7 : 0.4,
        depthWrite: false,
      });
      const disc = new THREE.Mesh(
        kind === "rock"
          ? new THREE.CylinderGeometry(R, R * 1.12, depth, 9, 2)
          : new THREE.CylinderGeometry(R, R * 0.93, depth, 56, 1, true),
        mat,
      );
      if (kind === "rock") {
        const pos = disc.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          if (y > 0) {
            pos.setX(i, pos.getX(i) * (0.86 + rnd() * 0.28));
            pos.setZ(i, pos.getZ(i) * (0.86 + rnd() * 0.28));
            pos.setY(i, y * (0.7 + rnd() * 0.6));
          }
        }
        disc.geometry.computeVertexNormals();
      }
      disc.position.y = -depth / 2 + 0.01;
      disc.renderOrder = 2;
      ground.add(disc);
      disposables.push(disc.geometry, mat);

      // 不透明地表：承接阴影与植株
      const topMat = new THREE.MeshStandardMaterial({ map: groundTexture(kind), roughness: 1, color: kind === "rock" ? 0x9aa096 : 0x9d8a72 });
      const top = new THREE.Mesh(kind === "rock" ? new THREE.CircleGeometry(R, 9) : new THREE.CircleGeometry(R, 56), topMat);
      top.rotation.x = -Math.PI / 2;
      top.position.y = 0.002;
      top.receiveShadow = true;
      ground.add(top);
      disposables.push(top.geometry, topMat);
      // 容器口沿
      const lip = new THREE.Mesh(
        new THREE.TorusGeometry(R, 0.022, 6, 64),
        new THREE.MeshStandardMaterial({ color: "#cfe0d2", roughness: 0.25, metalness: 0.35, transparent: true, opacity: 0.5 }),
      );
      lip.rotation.x = -Math.PI / 2;
      lip.position.y = 0.004;
      ground.add(lip);
      disposables.push(lip.geometry, lip.material as THREE.Material);
      // 碎石与落叶
      const pebMat = new THREE.MeshStandardMaterial({
        color: kind === "rock" ? "#7d8279" : "#6d6152",
        roughness: 0.95,
      });
      const pebGeo = new THREE.IcosahedronGeometry(0.09, 0);
      for (let i = 0; i < 16; i++) {
        const a = rnd() * TAU;
        const r = 0.6 + rnd() * 1.9;
        const m = new THREE.Mesh(pebGeo, pebMat);
        m.position.set(Math.cos(a) * r, 0.01 + rnd() * 0.03, Math.sin(a) * r);
        m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        m.scale.setScalar(0.4 + rnd() * 1.5);
        m.castShadow = true;
        ground.add(m);
      }
      disposables.push(pebGeo, pebMat);
    }
  }
  world.add(ground);

  /* ---------------- 叶 / 花 / 果材质 ---------------- */
  const veinKind = isRadialLeaf(p.leafShape)
    ? "parallel"
    : caps.seed && p.hasFruit
      ? p.venation === "parallel"
        ? "parallel"
        : "reticulate"
      : grp.id === "gymno"
        ? "parallel"
        : grp.id === "algae"
          ? "none"
          : "reticulate";

  const leafTex = leafTexture({
    vein: veinKind as never,
    base: p.leafColor,
    tip: p.leafTipColor,
    seed: p.seed % 97,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    map: leafTex,
    side: THREE.DoubleSide,
    roughness: grp.id === "algae" ? 0.35 : 0.62,
    metalness: 0,
    color: grp.id === "algae" ? new THREE.Color("#bff0d8") : 0xffffff,
  });
  disposables.push(leafMat);

  /* ---------------- 枝条骨架 ---------------- */
  type Branch = {
    curve: THREE.CatmullRomCurve3;
    rBase: number;
    rTop: number;
    win: Win;
    depth: number;
    node?: TubeNode;
    leafT: number[];
    apex: THREE.Vector3;
  };
  const branches: Branch[] = [];

  const habit = grp.id === "moss" ? "tufted" : grp.id === "fern" ? "rosette" : p.habit;

  const pushBranch = (
    curve: THREE.CatmullRomCurve3,
    rBase: number,
    rTop: number,
    win: Win,
    depth: number,
  ) => {
    const b: Branch = { curve, rBase, rTop, win, depth, leafT: [], apex: curve.getPointAt(1) };
    branches.push(b);
    return b;
  };

  if (grp.id === "algae") {
    // 藻类：无根茎叶分化 —— 叶状体 / 丝状体
  } else if (habit === "tufted") {
    const n = grp.id === "moss" ? 9 : 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd() * 0.5;
      const rad = (grp.id === "moss" ? 0.1 : 0.16) * (0.4 + rnd());
      const h = H * (0.62 + rnd() * 0.5);
      const base = new THREE.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad);
      const c = stemCurve(h, rnd, "erect", Math.cos(a) * 0.35, a);
      c.points.forEach((pt) => pt.add(base));
      pushBranch(c, stemR * (0.75 + rnd() * 0.5), stemR * 0.25, [0.18 + i * 0.025, 0.6 + i * 0.02], 0);
    }
  } else if (habit === "rosette") {
    const n = grp.id === "fern" ? clamp(Math.round(3 + p.nodeCount * 0.4), 3, 8) : 1;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd() * 0.3;
      const h = grp.id === "fern" ? H * (0.85 + rnd() * 0.35) : H * 0.26;
      const pts: THREE.Vector3[] = [];
      const seg = 7;
      for (let s = 0; s <= seg; s++) {
        const t = s / seg;
        const arch = grp.id === "fern" ? 0.55 : 0.16;
        pts.push(
          new THREE.Vector3(
            Math.cos(a) * t * t * h * arch * 1.5,
            t * h * (1 - arch * t * 0.55),
            Math.sin(a) * t * t * h * arch * 1.5,
          ),
        );
      }
      pushBranch(
        new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4),
        stemR * (grp.id === "fern" ? 1.1 : 1.6),
        stemR * 0.3,
        [0.18 + i * 0.03, 0.58 + i * 0.02],
        0,
      );
    }
  } else {
    const c = stemCurve(H, rnd, habit === "climbing" ? "climbing" : "erect", rnd() - 0.5, rnd() * 3);
    pushBranch(c, stemR, stemR * 0.42, [0.16, 0.6], 0);
    if (habit === "branched" || (grp.id === "gymno" && p.habit === "branched")) {
      const main = branches[0];
      const n = grp.id === "gymno" ? 6 : 3;
      for (let i = 0; i < n; i++) {
        const t = grp.id === "gymno" ? 0.3 + (i / n) * 0.62 : 0.5 + (i / n) * 0.42;
        const attach = main.curve.getPointAt(t);
        const a = i * 2.39996 + rnd();
        const len = H * (grp.id === "gymno" ? 0.42 * (1 - t * 0.55) : 0.45 * (1 - t * 0.4)) * (0.8 + rnd() * 0.5);
        const dir = new THREE.Vector3(Math.cos(a), 0.62 + rnd() * 0.4, Math.sin(a)).normalize();
        const pts = [attach.clone()];
        for (let s = 1; s <= 4; s++) {
          const tt = s / 4;
          pts.push(
            attach
              .clone()
              .add(dir.clone().multiplyScalar(len * tt))
              .add(new THREE.Vector3(0, len * 0.16 * tt * tt, 0)),
          );
        }
        const start = main.win[0] + (main.win[1] - main.win[0]) * t;
        pushBranch(
          new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4),
          main.rBase * (1 - t) * 0.85 + stemR * 0.2,
          stemR * 0.16,
          [start, Math.min(0.78, start + (main.win[1] - main.win[0]) * (1 - t) * 1.25)],
          1,
        );
      }
    }
  }

  /* ---------------- 茎网格 ---------------- */
  const tubes: TubeNode[] = [];
  for (const b of branches) {
    const radial = grp.id === "moss" ? 5 : 8;
    const tubular = b.depth === 0 ? 60 : 34;
    const geo = taperedTube(b.curve, tubular, radial, (t) => b.rBase + (b.rTop - b.rBase) * Math.pow(t, 0.7));
    const mesh = new THREE.Mesh(geo, stemMat);
    mesh.castShadow = true;
    geo.setDrawRange(0, 0);
    root.add(mesh);
    disposables.push(geo);
    b.node = { mesh, win: b.win, rings: tubular, radial, phase: rnd() * 6 };
    tubes.push(b.node);
  }

  /* ---------------- 叶 ---------------- */
  const leaves: LeafNode[] = [];
  const twoRanked = grp.id === "fern" || (p.venation === "parallel" && caps.seed);
  const leafLen = p.leafLength * (grp.id === "fern" ? 0.42 : grp.id === "moss" ? 1 : 0.95) * (grp.id === "gymno" ? 0.55 : 1);
  const leafWid = p.leafWidth * (grp.id === "fern" ? 0.62 : 1);

  const leafGeoCache: THREE.BufferGeometry[] = [];
  const makeLeafGeo = (sizeK: number, droopK: number) => {
    const g = leafGeometry({
      shape: p.leafShape,
      length: leafLen * sizeK,
      width: Math.max(0.004, leafWid * sizeK * 0.5),
      curl: p.leafCurl,
      droop: p.leafDroop * droopK,
      twist: p.venation === "parallel" && caps.seed ? 0.55 * p.leafDroop : 0,
      fold: caps.seed && p.venation === "parallel" ? 0.22 : 0.05,
      lobes: p.leafLobes,
      lobeDepth: p.lobeDepth,
      segU: grp.id === "moss" ? 8 : grp.id === "fern" ? 14 : 22,
      segV: grp.id === "moss" ? 5 : grp.id === "fern" ? 7 : 12,
    });
    leafGeoCache.push(g);
    disposables.push(g);
    return g;
  };
  const geoFull = makeLeafGeo(1, 1);
  const geoMid = makeLeafGeo(0.82, 1.1);
  const geoSmall = makeLeafGeo(0.62, 1.25);

  // 蕨类孢子囊群：合并为每叶一个网格，避免绘制调用爆炸
  let sorusGeo: THREE.BufferGeometry | null = null;
  let sorusMat: THREE.MeshStandardMaterial | null = null;
  if (caps.sorus) {
    const parts: THREE.BufferGeometry[] = [];
    const dot = new THREE.IcosahedronGeometry(Math.max(0.013, leafLen * 0.07), 0);
    const m4 = new THREE.Matrix4();
    for (let rI = 0; rI < 2; rI++) {
      for (let i = 0; i < 5; i++) {
        const u = 0.3 + (i / 4) * 0.56;
        const v = rI === 0 ? -0.42 : 0.42;
        parts.push(dot.clone().applyMatrix4(m4.makeTranslation(v * leafWid * 0.8, u * leafLen * 0.92, -0.016)));
      }
    }
    dot.dispose();
    const merged = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    sorusGeo = merged;
    sorusMat = new THREE.MeshStandardMaterial({ color: p.sorusColor, roughness: 0.72 });
    if (merged) disposables.push(merged);
    disposables.push(sorusMat);
  }

  const up = new THREE.Vector3(0, 1, 0);
  const attachLeaf = (
    b: Branch,
    t: number,
    angle: number,
    geo: THREE.BufferGeometry,
    winOffset: Win,
    petiole: number,
    elev: number,
  ) => {
    const P = b.curve.getPointAt(clamp(t, 0.001, 0.999));
    const tan = b.curve.getTangentAt(clamp(t, 0.001, 0.999)).normalize();
    let n1 = new THREE.Vector3().crossVectors(up, tan);
    if (n1.lengthSq() < 1e-5) n1 = new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), tan);
    n1.normalize();
    const n2 = new THREE.Vector3().crossVectors(tan, n1).normalize();
    const dir = n1
      .clone()
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(n2, Math.sin(angle));
    dir.y *= 0.3; // 叶片沿茎周向展开，避免下垂枝条上的叶插入土中
    dir.normalize();
    const leafDir = dir.clone().multiplyScalar(Math.cos(elev)).addScaledVector(up, Math.sin(elev)).normalize();
    // X = leafDir × up，使局部 +Z（叶的上表面/叶脉面）朝向天空，而非朝下
    let X = new THREE.Vector3().crossVectors(leafDir, up);
    if (X.lengthSq() < 1e-5) X = n1.clone().negate();
    X.normalize();
    const Z = new THREE.Vector3().crossVectors(X, leafDir).normalize();

    const rAt = b.rBase + (b.rTop - b.rBase) * Math.pow(clamp(t, 0, 1), 0.7);
    const pivot = new THREE.Group();
    pivot.position.copy(P).addScaledVector(dir, rAt * 0.72 + 0.004);
    pivot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, leafDir, Z));
    pivot.scale.setScalar(0.001);
    pivot.userData.organ = "leaf";

    if (petiole > 0.01) {
      const pc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, petiole * 0.55, petiole * 0.12),
        new THREE.Vector3(0, petiole, petiole * 0.05),
      ]);
      const pg = taperedTube(pc, 6, 5, (u) => stemR * (0.34 - 0.16 * u));
      const pm = new THREE.Mesh(pg, stemMat);
      pm.castShadow = true;
      pivot.add(pm);
      disposables.push(pg);
    }

    const swing = new THREE.Group();
    swing.position.y = petiole;
    const mesh = new THREE.Mesh(geo, leafMat);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    swing.add(mesh);
    pivot.add(swing);
    root.add(pivot);

    const node: LeafNode = {
      pivot,
      swing,
      win: winOffset,
      phase: rnd() * TAU,
      fold: -(0.9 + rnd() * 0.7),
      twist: (rnd() - 0.5) * 1.5,
    };

    // 蕨类：叶背孢子囊群
    if (caps.sorus && sorusGeo && sorusMat) {
      const m = new THREE.Mesh(sorusGeo, sorusMat);
      m.scale.setScalar(0.001);
      swing.add(m);
      const k = leaves.length % 9;
      node.sori = [{ mesh: m, win: [0.63 + k * 0.014, 0.8 + k * 0.014] }];
    }
    leaves.push(node);
    return node;
  };

  if (grp.id === "algae") {
    // 无叶
  } else {
    const n = grp.id === "fern" ? clamp(Math.round(6 + p.nodeCount * 0.7), 6, 16) : Math.round(p.nodeCount);
    for (const b of branches) {
      const isFernFrond = grp.id === "fern";
      const count = isFernFrond ? n : b.depth === 0 && habit !== "tufted" ? n : Math.max(2, Math.round(n * 0.5));
      const t0 = p.phyllotaxy === "basal" || isFernFrond ? 0.08 : 0.18;
      const t1 = isFernFrond ? 0.95 : 0.94;
      for (let i = 0; i < count; i++) {
        const t = t0 + ((t1 - t0) * (i + 0.5)) / count;
        let angle: number;
        if (isFernFrond || twoRanked) angle = (i % 2) * Math.PI + b.depth * 0.6;
        else if (p.phyllotaxy === "opposite") angle = (i % 2) * Math.PI + Math.floor(i / 2) * 0.7;
        else if (p.phyllotaxy === "whorled") angle = ((i % 4) / 4) * TAU + Math.floor(i / 4) * 0.8;
        else if (p.phyllotaxy === "basal") angle = (i / count) * TAU;
        else angle = i * 2.39996 + b.depth;

        const sizeK = isFernFrond ? 1 - 0.55 * Math.pow(t, 1.4) : 1 - 0.22 * t;
        const geo = isFernFrond
          ? sizeK > 0.75
            ? geoFull
            : sizeK > 0.5
              ? geoMid
              : geoSmall
          : sizeK > 0.85
            ? geoFull
            : geoMid;
        const g0 = b.win[0] + (b.win[1] - b.win[0]) * t;
        const petiole = isFernFrond ? 0.005 : (p.phyllotaxy === "basal" ? 0.32 : 0.14) * leafLen * (caps.seed ? 1 : 0.7);
        const elev =
          p.phyllotaxy === "basal" || isFernFrond
            ? 0.42 + t * 0.5
            : 0.55 - t * 0.35 + (grp.id === "moss" ? 0.5 : 0);
        const ln = attachLeaf(
          b,
          t,
          angle,
          geo,
          [g0, Math.min(0.92, g0 + 0.16)],
          petiole * (grp.id === "moss" ? 0.1 : 1),
          elev,
        );
        ln.swing.scale.setScalar(sizeK);
        b.leafT.push(t);
      }
    }
    // 子叶
    if (caps.seed) {
      const cN = grp.id === "gymno" ? 7 : caps.cotyledon ?? 2;
      const cGeo = leafGeometry({
        shape: grp.id === "gymno" ? "needle" : "ovate",
        length: leafLen * (grp.id === "gymno" ? 1.5 : 0.85),
        width: leafWid * (grp.id === "gymno" ? 0.22 : 0.62),
        curl: 0.2,
        droop: 0.4,
        segU: 12,
        segV: 7,
      });
      disposables.push(cGeo);
      const mainB = branches[0];
      for (let i = 0; i < cN; i++) {
        const fake: Branch = { ...mainB, curve: mainB.curve };
        attachLeaf(fake, 0.06 + i * 0.002, (i / cN) * TAU, cGeo, [0.24, 0.42], 0.02, 0.85);
      }
    }
  }

  /* ---------------- 藻类营养体 ---------------- */
  const algaeTubes: TubeNode[] = [];
  let algaeTop: THREE.Object3D | null = null;
  let algaeMid: THREE.Object3D | null = null;
  const algaeTips: THREE.Object3D[] = [];
  if (grp.id === "algae") {
    const algaeMat = new THREE.MeshStandardMaterial({
      map: leafTexture({ vein: "none", base: p.leafColor, tip: p.leafTipColor }),
      color: 0xdff5e8,
      roughness: 0.32,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    disposables.push(algaeMat);
    const form = p.thallusForm;
    const n = form === "filament" ? 7 : form === "sheet" ? 5 : 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd() * 0.6;
      const rad = 0.12 + rnd() * 0.55;
      const h = H * (0.55 + rnd() * 0.7);
      const pts: THREE.Vector3[] = [];
      const seg = 9;
      for (let s = 0; s <= seg; s++) {
        const t = s / seg;
        if (form === "filament") {
          const sw = Math.sin(t * 5 + a * 2) * 0.16 * t;
          pts.push(new THREE.Vector3(Math.cos(a) * rad + sw, t * h, Math.sin(a) * rad + Math.cos(t * 4 + a) * 0.14 * t));
        } else if (form === "sheet") {
          pts.push(new THREE.Vector3(Math.cos(a) * rad * (0.4 + t), t * h * 0.85, Math.sin(a) * rad * (0.4 + t)));
        } else {
          pts.push(new THREE.Vector3(Math.cos(a) * rad * t * 1.6, t * h, Math.sin(a) * rad * t * 1.6));
        }
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4);
      const r0 = form === "sheet" ? 0.16 : form === "branched" ? 0.05 : 0.035;
      const geo = taperedTube(curve, 46, form === "sheet" ? 10 : 7, (t) =>
        form === "sheet" ? r0 * (0.35 + Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.9) : r0 * (1 - t * 0.8),
      );
      const mesh = new THREE.Mesh(geo, algaeMat);
      mesh.castShadow = false;
      geo.setDrawRange(0, 0);
      root.add(mesh);
      disposables.push(geo);
      const node = { mesh, win: [0.24 + i * 0.03, 0.64 + i * 0.02] as Win, rings: 46, radial: form === "sheet" ? 10 : 7, phase: rnd() * 6 };
      algaeTubes.push(node);
      tubes.push(node);
      {
        const tipA = new THREE.Object3D();
        tipA.position.copy(curve.getPointAt(0.96));
        root.add(tipA);
        algaeTips.push(tipA);
        if (i === 0) {
          const midA = new THREE.Object3D();
          midA.position.copy(curve.getPointAt(0.42));
          root.add(midA);
          algaeTop = tipA;
          algaeMid = midA;
        }
      }

      // 螺旋带状叶绿体（水绵特征）
      if (form === "filament") {
        const hp: THREE.Vector3[] = [];
        for (let s = 0; s <= 40; s++) {
          const t = s / 40;
          const base = curve.getPointAt(t);
          const ang = t * 22 + i;
          hp.push(base.clone().add(new THREE.Vector3(Math.cos(ang) * 0.018, 0, Math.sin(ang) * 0.018)));
        }
        const hc = new THREE.CatmullRomCurve3(hp);
        const hg = taperedTube(hc, 40, 4, () => 0.012);
        const hm = new THREE.Mesh(
          hg,
          new THREE.MeshStandardMaterial({ color: "#2f7a45", roughness: 0.5 }),
        );
        mesh.add(hm);
        disposables.push(hg);
        node.win = [0.24 + i * 0.03, 0.64 + i * 0.02];
      }
    }
  }

  /* ---------------- 根 ---------------- */
  const rootKind = !caps.trueRoot
    ? grp.id === "algae"
      ? "none"
      : "rhizoid"
    : p.venation === "parallel" && caps.seed && grp.id !== "gymno"
      ? "fibrous"
      : grp.id === "fern"
        ? "fibrous"
        : "tap";
  const rootGroup = buildRoots(
    rootKind as "tap" | "fibrous" | "rhizoid" | "none",
    grp.id === "moss" ? 0.5 : grp.id === "gymno" ? 1.5 : 1.1,
    rootKind === "rhizoid" ? "#8a7a52" : mix("#c9a97a", "#6d4f31", p.woodiness),
    rnd,
  );
  rootGroup.position.y = 0.02;
  rootGroup.scale.setScalar(0.001);
  rootGroup.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = false;
  });
  root.add(rootGroup);
  const rootWin: Win = grp.id === "algae" ? [0.2, 0.3] : [0.14, 0.44];

  /* ---------------- 种子 / 孢子 / 早期配子体 ---------------- */
  const seedGroup = new THREE.Group();
  const earlyGroup = new THREE.Group();
  root.add(seedGroup, earlyGroup);
  let seedHalves: THREE.Group[] = [];
  if (caps.seed) {
    const s = buildSeed(0.115 * (grp.id === "gymno" ? 1.15 : 1), grp.id === "gymno" ? "#c8a06a" : "#a8794a", grp.id === "gymno");
    s.position.set(0.02, 0.06, 0.03);
    s.rotation.z = 0.4;
    seedGroup.add(s);
    seedHalves = s.userData.halves as THREE.Group[];
  } else {
    const sporeMat = new THREE.MeshStandardMaterial({ map: seedTexture("#7d8f4a"), roughness: 0.8 });
    disposables.push(sporeMat);
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.045 + rnd() * 0.02, 10, 8), sporeMat);
      m.position.set((rnd() - 0.5) * 0.24, 0.05, (rnd() - 0.5) * 0.24);
      m.scale.y = 0.8;
      seedGroup.add(m);
    }
  }
  // 苔藓原丝体 / 蕨类原叶体
  if (grp.id === "moss") {
    const pm = new THREE.MeshStandardMaterial({ color: "#5d8f3c", roughness: 0.8 });
    disposables.push(pm);
    for (let i = 0; i < 9; i++) {
      const a = rnd() * TAU;
      const len = 0.16 + rnd() * 0.3;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(Math.cos(a) * len * 0.5, 0.03, Math.sin(a) * len * 0.5),
        new THREE.Vector3(Math.cos(a) * len, 0.012, Math.sin(a) * len),
      ]);
      const g = taperedTube(c, 8, 4, () => 0.008);
      const m = new THREE.Mesh(g, pm);
      earlyGroup.add(m);
      disposables.push(g);
    }
  } else if (grp.id === "fern") {
    const g = leafGeometry({ shape: "cordate", length: 0.34, width: 0.17, curl: 0.25, segU: 16, segV: 10 });
    const m = new THREE.Mesh(
      g,
      new THREE.MeshStandardMaterial({
        map: leafTexture({ vein: "reticulate", base: "#4e8f42", tip: "#8fc45a" }),
        side: THREE.DoubleSide,
        roughness: 0.6,
      }),
    );
    m.rotation.x = -Math.PI / 2 + 0.1;
    m.position.set(0.24, 0.02, 0.16);
    earlyGroup.add(m);
    disposables.push(g);
  } else if (grp.id === "algae") {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 10),
      new THREE.MeshStandardMaterial({ color: "#4f9a63", roughness: 0.4 }),
    );
    m.position.y = 0.05;
    earlyGroup.add(m);
  }
  earlyGroup.scale.setScalar(0.001);
  const earlyWin: Win = grp.id === "algae" ? [0.16, 0.3] : [0.16, 0.34];
  const earlyFade: Win = [0.42, 0.62];

  /* ---------------- 繁殖结构：花 / 球花 / 孢蒴 ---------------- */
  const repro: ReproNode[] = [];
  const flowerAnchors: THREE.Object3D[] = [];
  const fruitAnchors: THREE.Object3D[] = [];
  const maleCones: THREE.Object3D[] = [];
  const femaleCones: THREE.Object3D[] = [];

  const placeRepro = (b: Branch, t: number, dirAngle: number, winBud: Win, winBloom: Win) => {
    const P = b.curve.getPointAt(clamp(t, 0.02, 1));
    const tan = b.curve.getTangentAt(clamp(t, 0.02, 1)).normalize();
    let n1 = new THREE.Vector3().crossVectors(up, tan);
    if (n1.lengthSq() < 1e-5) n1 = new THREE.Vector3(1, 0, 0);
    n1.normalize();
    const n2 = new THREE.Vector3().crossVectors(tan, n1).normalize();
    const dir = n1.clone().multiplyScalar(Math.cos(dirAngle)).addScaledVector(n2, Math.sin(dirAngle)).normalize();
    const rAt = b.rBase + (b.rTop - b.rBase) * Math.pow(clamp(t, 0, 1), 0.7);
    const pivot = new THREE.Group();
    pivot.position.copy(P).addScaledVector(dir, rAt * 0.6);
    const outDir = dir.clone().multiplyScalar(0.55).addScaledVector(up, 0.72).normalize();
    let X = new THREE.Vector3().crossVectors(up, outDir);
    if (X.lengthSq() < 1e-5) X = n1.clone();
    X.normalize();
    // 花的对称轴（局部 +Z）对准 outDir
    const Yb = new THREE.Vector3().crossVectors(outDir, X).normalize();
    pivot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Yb, outDir));
    pivot.scale.setScalar(0.001);

    const pedLen = 0.16 * (0.6 + p.flowerSize);
    const pc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, pedLen),
    ]);
    const pg = taperedTube(pc, 4, 5, () => stemR * 0.3);
    pivot.add(new THREE.Mesh(pg, stemMat));
    disposables.push(pg);

    const head = new THREE.Group();
    head.position.z = pedLen;
    pivot.add(head);

    const node: ReproNode = { pivot, winBud, winBloom, petals: [], stamens: [], phase: rnd() * 6 };

    if (caps.trueFlower) {
      const f = buildFlower({
        petalShape: p.petalShape === "needle" ? "lanceolate" : p.petalShape,
        petalCount: Math.max(3, Math.round(p.petalCount)),
        corolla: p.corolla,
        size: 0.18 + p.flowerSize * 0.34,
        petalColor: p.petalColor,
        petalColor2: p.petalColor2,
        centerColor: p.centerColor,
        stamenCount: p.stamenCount,
        rnd,
      });
      head.add(f.group);
      node.petals = f.petals;
      node.stamens = f.stamens;
      node.antherMat = f.antherMat;
      // 预存花药色端值，避免每帧解析颜色字符串
      node.antherStart = new THREE.Color(p.centerColor).multiplyScalar(0.66);
      node.antherRipe = new THREE.Color("#f6d76b");
      node.budScale = f.budScale;
      node.pistil = f.pistil;
      // 果实
      const R = 0.09 + p.fruitSize * 0.2;
      let fobj: THREE.Object3D;
      let fmat: THREE.MeshStandardMaterial | undefined;
      if (p.fruitType === "aggregate") {
        fobj = buildAggregateFruit(R, p.fruitColor);
      } else {
        const fg = fruitGeometry(p.fruitType, R, rnd);
        fmat = new THREE.MeshStandardMaterial({ color: p.fruitColor, roughness: p.fruitType === "nut" ? 0.75 : 0.32 });
        fobj = new THREE.Mesh(fg, fmat);
        fobj.castShadow = true;
        disposables.push(fg, fmat);
      }
      fobj.position.z = 0.02;
      fobj.rotation.x = Math.PI; // 果实下垂
      fobj.scale.setScalar(0.001);
      head.add(fobj);
      node.fruit = {
        obj: fobj,
        win: [0.8, 0.94],
        mat: fmat,
        unripe: new THREE.Color(mix(p.leafColor, p.fruitColor, 0.25)),
        ripe: new THREE.Color(p.fruitColor),
      };
      fruitAnchors.push(head);
      disposables.push(...collectMaterials(f.group));
    } else if (caps.cone) {
      const female = t > 0.62;
      const c = buildStrobilus({
        size: 0.1 + p.coneSize * 0.14,
        scales: female ? 26 : 16,
        color: female ? p.coneColor : mix(p.coneColor, "#c9a86a", 0.5),
        female,
        rnd,
      });
      c.rotation.x = Math.PI / 2;
      head.add(c);
      node.cone = { obj: c, pivots: c.userData.pivots as THREE.Group[], win: [0.62, 0.9], female };
      disposables.push(...collectMaterials(c));
      (female ? femaleCones : maleCones).push(head);
      fruitAnchors.push(head);
    }
    pivot.userData.organ = "repro";
    root.add(pivot);
    flowerAnchors.push(head);
    repro.push(node);
    return node;
  };

  if (caps.trueFlower || caps.cone) {
    const tips = branches.filter((b) => b.depth === 1);
    const hosts = tips.length ? tips : branches;
    if (p.inflorescence === "solitary" || caps.cone) {
      const n = caps.cone ? Math.min(4, hosts.length + 2) : Math.min(hosts.length, 4);
      for (let i = 0; i < n; i++) {
        const b = hosts[i % hosts.length];
        placeRepro(b, caps.cone ? 0.55 + (i % 3) * 0.18 : 0.985, i * 2.39996, [0.56, 0.7], [0.64, 0.8]);
      }
      if (!caps.cone && hosts.length === 1) {
        // 主茎顶端一朵
      }
    } else if (p.inflorescence === "raceme" || p.inflorescence === "spike") {
      const n = p.inflorescence === "spike" ? 9 : 5;
      hosts.slice(0, 2).forEach((b, bi) => {
        for (let i = 0; i < n; i++) {
          const t = 0.48 + (i / n) * 0.49;
          const d = bi * 0.03;
          placeRepro(
            b,
            t,
            p.inflorescence === "spike" ? i * 2.39996 : (i % 2) * Math.PI,
            [0.5 + i * 0.016 + d, 0.62 + i * 0.016 + d],
            [0.6 + i * 0.014 + d, 0.74 + i * 0.014 + d],
          );
        }
      });
    } else {
      // 伞形花序
      const n = 6;
      hosts.slice(0, 2).forEach((b, bi) => {
        for (let i = 0; i < n; i++) {
          const d = bi * 0.04;
          placeRepro(
            b,
            0.98 - i * 0.004,
            (i / n) * TAU,
            [0.54 + i * 0.012 + d, 0.66 + i * 0.012 + d],
            [0.63 + i * 0.012 + d, 0.77 + i * 0.012 + d],
          );
        }
      });
    }
  }

  /* ---------------- 苔藓孢蒴 ---------------- */
  const capsules: { group: THREE.Group; seta: TubeNode; cap: THREE.Object3D; lid: THREE.Object3D; win: Win; winLid: Win }[] = [];
  if (caps.capsule) {
    const nC = 5;
    const capMat = new THREE.MeshStandardMaterial({ color: p.capsuleColor, roughness: 0.55 });
    const lidMat = new THREE.MeshStandardMaterial({ color: shade(p.capsuleColor, 0.22), roughness: 0.6 });
    disposables.push(capMat, lidMat);
    for (let i = 0; i < nC; i++) {
      const a = (i / nC) * TAU + rnd();
      const rad = 0.06 + rnd() * 0.16;
      const h = H * (1.5 + rnd() * 0.9);
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * rad * 0.3, H * 0.35, Math.sin(a) * rad * 0.3),
        new THREE.Vector3(Math.cos(a) * rad, h * 0.55, Math.sin(a) * rad),
        new THREE.Vector3(Math.cos(a) * rad * 1.25, h * 0.9, Math.sin(a) * rad * 1.25),
        new THREE.Vector3(Math.cos(a) * rad * 1.3, h, Math.sin(a) * rad * 1.3),
      ]);
      const geo = taperedTube(c, 30, 5, () => 0.011);
      geo.setDrawRange(0, 0);
      const mesh = new THREE.Mesh(geo, stemMat);
      mesh.castShadow = true;
      root.add(mesh);
      disposables.push(geo);
      const seta: TubeNode = { mesh, win: [0.62 + i * 0.03, 0.84 + i * 0.02], rings: 30, radial: 5, phase: rnd() * 6 };
      tubes.push(seta);

      const cg = new THREE.Group();
      const end = c.getPointAt(1);
      cg.position.copy(end);
      cg.scale.setScalar(0.001);
      const urn = new THREE.Mesh(
        new THREE.LatheGeometry(
          [0, 0.18, 0.42, 0.62, 0.86, 1].map((t) => new THREE.Vector2(Math.max(0.004, Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.055 + 0.012), t * 0.17)),
          14,
        ),
        capMat,
      );
      urn.castShadow = true;
      const lid = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.075, 12), lidMat);
      lid.position.y = 0.19;
      cg.add(urn, lid);
      cg.rotation.z = 0.5 + rnd() * 0.5;
      root.add(cg);
      disposables.push(urn.geometry, lid.geometry);
      capsules.push({ group: cg, seta, cap: urn, lid, win: [0.74 + i * 0.03, 0.88 + i * 0.02], winLid: [0.9, 0.97] });
      flowerAnchors.push(cg);
      fruitAnchors.push(cg);
    }
  }

  /* ---------------- 繁殖微粒：散粉（开花期）· 散孢（蕨·藓·藻）· 散种（裸子·开裂干果） ----------------
     被子植物在结实期绝不散出孢子：花粉只属于开花期，种子始终由果皮包被。            */
  // 临时恢复各枢轴比例，取得成熟状态下的世界坐标作为发射点
  for (const l of leaves) l.pivot.scale.setScalar(1);
  for (const r of repro) r.pivot.scale.setScalar(1);
  for (const c of capsules) c.group.scale.setScalar(1);
  seedGroup.scale.setScalar(1);
  earlyGroup.scale.setScalar(1);
  rootGroup.scale.setScalar(1);
  root.updateMatrixWorld(true);

  type PuffMode = "pollen" | "spore" | "seed";
  type Puff = {
    points: THREE.Points;
    geo: THREE.BufferGeometry;
    mat: THREE.PointsMaterial;
    data: { origin: THREE.Vector3; ph: number; sp: number; r: number }[];
    mode: PuffMode;
    win: Win;
    vy: number;
    spread: number;
    peak: number;
  };
  const puffs: Puff[] = [];
  const makePuff = (
    n: number,
    origins: THREE.Object3D[],
    color: string,
    size: number,
    mode: PuffMode,
    win: Win,
    vy: number,
    spread: number,
    peak = 0.8,
  ) => {
    if (!origins.length) return;
    const pos = new Float32Array(n * 3);
    const data: Puff["data"] = [];
    const wp = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      origins[i % origins.length].getWorldPosition(wp);
      data.push({ origin: wp.clone(), ph: rnd() * TAU, sp: 0.16 + rnd() * 0.7, r: rnd() });
      pos[i * 3] = wp.x;
      pos[i * 3 + 1] = wp.y;
      pos[i * 3 + 2] = wp.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size,
      map: softSprite(),
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: mode === "seed" ? THREE.NormalBlending : THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = mode === "seed" ? 4 : 2;
    pts.userData.noBounds = true;
    world.add(pts);
    disposables.push(geo, mat);
    puffs.push({ points: pts, geo, mat, data, mode, win, vy, spread, peak });
  };

  const dehiscent = p.fruitType === "capsule" || p.fruitType === "legume";
  const fleshy = !dehiscent && p.fruitType !== "nut";
  const soriOrigins = leaves.filter((l) => l.sori).map((l) => l.swing);

  if (caps.trueFlower) {
    // 被子植物 —— 开花期：花药散出花粉；结实期：果皮包被种子
    makePuff(170, flowerAnchors, "#f7dd8c", 0.03, "pollen", [0.655, 0.82], 0.24, 0.9, 0.7);
    if (dehiscent) {
      // 蒴果／荚果为开裂干果：成熟时果瓣开裂弹出种子（非孢子）
      makePuff(70, fruitAnchors, "#c19a5c", 0.055, "seed", [0.93, 1.0], -1.9, 0.5, 0.95);
    }
    // 浆果·核果·梨果·聚合果·颖果：种子留在果皮内，靠动物或整粒传播，不散出任何微粒
  } else if (caps.cone) {
    // 裸子植物 —— 雄球花散粉；球果张开后具翅种子旋落（种子裸露，无果皮）
    makePuff(190, maleCones, "#efd883", 0.03, "pollen", [0.6, 0.79], 0.32, 1.2, 0.75);
    makePuff(70, femaleCones, "#d3b183", 0.075, "seed", [0.9, 1.0], -2.4, 0.9, 0.95);
  } else if (caps.sorus) {
    // 蕨类 —— 孢子囊群弹散孢子
    makePuff(200, soriOrigins, "#c89a4a", 0.04, "spore", [0.82, 1.0], 1.5, 0.95);
  } else if (caps.capsule) {
    // 苔藓 —— 蒴盖脱落后孢蒴散出孢子
    makePuff(180, capsules.map((c) => c.group), "#b6cf6a", 0.04, "spore", [0.88, 1.0], 1.3, 0.85);
  } else {
    // 藻类 —— 孢子囊放散游动孢子
    makePuff(190, algaeTips.length ? algaeTips : [root], "#8fe6c8", 0.05, "spore", [0.82, 1.0], 0.95, 0.8);
  }

  const releaseColor = caps.trueFlower
    ? "#f7dd8c"
    : caps.cone
      ? "#efd883"
      : caps.sorus
        ? "#c89a4a"
        : caps.capsule
          ? "#b6cf6a"
          : "#8fe6c8";

  // 环境浮尘
  const DN = 170;
  const dPos = new Float32Array(DN * 3);
  const dData: { x: number; y: number; z: number; s: number }[] = [];
  for (let i = 0; i < DN; i++) {
    const a = rnd() * TAU;
    const r = 0.5 + rnd() * 3.2;
    dData.push({ x: Math.cos(a) * r, y: rnd() * 3.6, z: Math.sin(a) * r, s: 0.1 + rnd() * 0.5 });
    dPos[i * 3] = dData[i].x;
    dPos[i * 3 + 1] = dData[i].y;
    dPos[i * 3 + 2] = dData[i].z;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({
    size: 0.035,
    map: softSprite(),
    color: new THREE.Color(mix("#cfe8c0", releaseColor, 0.3)),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dGeo, dMat);
  dust.frustumCulled = false;
  world.add(dust);
  disposables.push(dGeo, dMat);

  /* ---------------- 标注锚点 ---------------- */
  const anchors: Anchor[] = [];
  const addAnchor = (id: string, key: string, label: string, sub: string, node: THREE.Object3D, from: number, to: number) => {
    anchors.push({ id, key, label, sub, node, from, to });
  };
  const stemAnchor = new THREE.Object3D();
  if (branches[0]) {
    stemAnchor.position.copy(branches[0].curve.getPointAt(0.55));
    root.add(stemAnchor);
  }
  const rootAnchor = new THREE.Object3D();
  rootAnchor.position.set(0.25, rootKind === "tap" ? -0.85 : -0.4, 0.1);
  root.add(rootAnchor);
  const leafAnchor = leaves.length ? leaves[Math.floor(leaves.length * 0.55)].pivot : stemAnchor;

  if (grp.id === "algae") {
    addAnchor("spore", "algaeSpore", "游动孢子", "zoospora", seedGroup, 0, 0.3);
    addAnchor("body", "algaeBody", "叶状体（无根茎叶）", "thallus", algaeMid ?? root, 0.3, 1);
    addAnchor("spo2", "algaeSporangium", "孢子囊", "sporangium", algaeTop ?? root, 0.74, 1);
  } else {
    addAnchor(
      "seed",
      caps.seed ? "seed" : "spore",
      caps.seed ? "种子" : "孢子",
      caps.seed ? "semen" : "spora",
      seedGroup,
      0,
      caps.seed ? 0.3 : 0.24,
    );
    if (grp.id === "fern") addAnchor("pro", "prothallus", "原叶体", "prothallium", earlyGroup, 0.17, 0.5);
    if (grp.id === "moss") addAnchor("pro", "protonema", "原丝体", "protonema", earlyGroup, 0.17, 0.45);
    if (rootKind !== "none")
      addAnchor(
        "root",
        rootKind === "rhizoid" ? "rootRhizoid" : rootKind === "tap" ? "rootTap" : "rootFibrous",
        rootKind === "rhizoid" ? "假根" : rootKind === "tap" ? "主根（直根系）" : "须根系",
        rootKind === "rhizoid" ? "rhizoideum" : "radix",
        rootAnchor,
        0.22,
        1,
      );
    if (caps.leaves || branches.length)
      addAnchor(
        "stem",
        grp.id === "fern" ? "stemFern" : grp.id === "moss" ? "stemMoss" : "stem",
        grp.id === "fern" ? "根状茎／叶柄" : grp.id === "moss" ? "茎（无维管束）" : "茎",
        "caulis",
        stemAnchor,
        0.34,
        1,
      );
    if (caps.leaves)
      addAnchor(
        "leaf",
        grp.id === "fern" ? "leafFern" : "leaf",
        grp.id === "fern" ? "羽状复叶" : "叶",
        "folium",
        leafAnchor,
        0.44,
        1,
      );
    if (caps.trueFlower) addAnchor("flower", "flower", "花", "flos", flowerAnchors[0] ?? root, 0.6, 0.85);
    if (caps.fruit) addAnchor("fruit", "fruit", "果实（果皮包被）", "fructus", fruitAnchors[0] ?? root, 0.84, 1);
    if (caps.cone) {
      addAnchor("cone", "cone", "孢子叶球", "strobilus", flowerAnchors[0] ?? root, 0.6, 0.86);
      addAnchor("seed2", "seedNaked", "裸露种子", "semen nudum", fruitAnchors[0] ?? root, 0.86, 1);
    }
    if (caps.sorus) addAnchor("sorus", "sorus", "孢子囊群", "sorus", leaves.find((l) => l.sori)?.swing ?? root, 0.68, 1);
    if (caps.capsule) addAnchor("capsule", "capsule", "孢蒴（孢子体）", "sporogonium", capsules[0]?.group ?? root, 0.76, 1);
  }

  /* ---------------- 每帧更新 ---------------- */
  const tmpColor = new THREE.Color();
  function update(g: number, time: number, windOverride?: number) {
    const wind = windOverride ?? p.wind;
    root.rotation.z = Math.sin(time * 0.62) * 0.02 * wind;
    root.rotation.x = Math.cos(time * 0.47) * 0.014 * wind;

    // 茎
    for (const t of tubes) {
      const f = ease(prog(g, t.win));
      const rings = Math.max(0, Math.floor(f * t.rings));
      t.mesh.geometry.setDrawRange(0, rings * t.radial * 6);
      t.mesh.visible = rings > 0;
    }
    // 根
    {
      const f = ease(prog(g, rootWin));
      rootGroup.scale.setScalar(Math.max(0.001, f));
      rootGroup.visible = f > 0.02;
    }
    // 种子
    {
      const appear = smoothstep(-0.05, 0.0, g);
      const crack = smoothstep(0.15, 0.24, g);
      const gone = 1 - smoothstep(0.3, 0.44, g);
      const s = appear * gone;
      seedGroup.scale.setScalar(Math.max(0.001, s));
      seedGroup.visible = s > 0.02;
      seedHalves.forEach((h, i) => {
        h.rotation.y = (i === 0 ? 1 : -1) * crack * 1.5;
        h.position.x = (i === 0 ? 1 : -1) * crack * 0.05;
      });
      seedGroup.rotation.y = Math.sin(time * 0.4) * 0.04;
    }
    // 早期配子体
    {
      const f = ease(prog(g, earlyWin));
      const fade = 1 - smoothstep(earlyFade[0], earlyFade[1], g) * (grp.id === "fern" ? 0.92 : grp.id === "algae" ? 0.95 : 0.2);
      const s = f * fade;
      earlyGroup.scale.setScalar(Math.max(0.001, s));
      earlyGroup.visible = s > 0.02;
    }
    // 叶
    for (const l of leaves) {
      const f = prog(g, l.win);
      const e = ease(f);
      l.pivot.scale.setScalar(Math.max(0.001, e) * (l.swing.userData.sizeK ?? 1));
      l.pivot.visible = e > 0.02;
      const sway = Math.sin(time * 1.35 + l.phase) * 0.055 * wind;
      l.swing.rotation.x = l.fold * (1 - e) + sway;
      l.swing.rotation.z = l.twist * (1 - e) + Math.sin(time * 0.9 + l.phase * 1.7) * 0.035 * wind;
      if (l.sori) {
        for (const so of l.sori) {
          const sf = ease(prog(g, so.win));
          so.mesh.scale.setScalar(Math.max(0.001, sf));
          so.mesh.visible = sf > 0.02;
        }
      }
    }
    // 繁殖结构
    for (const r of repro) {
      const bud = ease(prog(g, r.winBud));
      const bloom = ease(prog(g, r.winBloom));
      const s = Math.max(0.001, 0.12 + bud * 0.88);
      r.pivot.scale.setScalar(s);
      r.pivot.visible = bud > 0.01;
      r.pivot.rotation.z = Math.sin(time * 1.1 + r.phase) * 0.05 * wind;
      const open = 1.34 - bloom * 1.56; // 蕾期向花轴正向合拢 → 盛开平展微反卷
      if (r.petals.length) {
        for (const pet of r.petals) {
          pet.rotation.x = open;
          pet.scale.setScalar(Math.max(0.05, 0.25 + bloom * 0.75));
        }
      } else if (r.budScale) {
        // 合瓣花冠：整体膨大并轻微旋转开放
        r.budScale.scale.setScalar(Math.max(0.05, 0.2 + bloom * 0.8));
        r.budScale.rotation.z = bloom * 0.5;
      }
      for (const st of r.stamens) {
        st.scale.setScalar(Math.max(0.001, smoothstep(0.66, 0.84, g)));
      }
      if (r.pistil) {
        r.pistil.scale.setScalar(Math.max(0.001, bloom * (1 - smoothstep(0.8, 0.9, g))));
      }
      if (r.antherMat && r.antherStart && r.antherRipe) {
        tmpColor.copy(r.antherStart).lerp(r.antherRipe, smoothstep(0.68, 0.8, g));
        r.antherMat.color.copy(tmpColor);
      }
      // 花谢 → 结果
      const wither = smoothstep(0.79, 0.9, g);
      if (r.fruit) {
        const ff = ease(prog(g, r.fruit.win));
        const ripen = smoothstep(0.88, 1.0, g);
        const openF = dehiscent ? smoothstep(0.92, 1.0, g) : 0;
        // 开裂干果：果瓣向外张开；肉质果：成熟时再度膨大并微微下垂
        const k = Math.max(0.001, ff) * (1 + ripen * (fleshy ? 0.09 : 0.02));
        r.fruit.obj.scale.set(k * (1 + openF * 0.3), k * (1 - openF * 0.14), k * (1 + openF * 0.3));
        r.fruit.obj.rotation.z = openF * 0.55 + ripen * 0.16;
        r.fruit.obj.visible = ff > 0.02;
        if (r.fruit.mat && r.fruit.unripe && r.fruit.ripe) {
          r.fruit.mat.color.copy(r.fruit.unripe).lerp(r.fruit.ripe, ripen);
          r.fruit.mat.roughness = fleshy ? 0.5 - ripen * 0.26 : 0.55 + ripen * 0.3;
        }
        for (const pet of r.petals) pet.scale.multiplyScalar(1 - wither * 0.94);
        for (const st of r.stamens) st.scale.multiplyScalar(1 - wither);
        if (r.budScale && r.petals.length === 0) r.budScale.scale.setScalar(Math.max(0.02, 1 - wither));
      }
      if (r.cone) {
        const open2 = smoothstep(r.cone.win[0], r.cone.win[1], g);
        for (const pv of r.cone.pivots) {
          pv.rotation.x = 0.1 + open2 * (r.cone.female ? 0.98 : 0.42);
        }
        r.pivot.scale.setScalar(Math.max(0.001, 0.2 + ease(prog(g, [0.5, 0.78])) * 0.8));
      }
    }
    // 苔藓孢蒴
    for (const c of capsules) {
      const f = ease(prog(g, c.win));
      c.group.scale.setScalar(Math.max(0.001, f));
      c.group.visible = f > 0.02;
      const lid = smoothstep(c.winLid[0], c.winLid[1], g);
      c.lid.position.y = 0.19 + lid * 0.5;
      c.lid.rotation.z = lid * 1.6;
      c.lid.scale.setScalar(Math.max(0.001, 1 - lid * 0.9));
      c.group.rotation.z += Math.sin(time * 1.4) * 0.0015 * wind;
    }
    // 繁殖微粒
    for (const pf of puffs) {
      const on = smoothstep(pf.win[0], pf.win[1], g);
      const off = 1 - smoothstep(pf.win[1], pf.win[1] + 0.08, g);
      const rel = on * off;
      pf.mat.opacity = rel * pf.peak;
      pf.points.visible = rel > 0.01;
      if (!pf.points.visible) continue;
      const arr = pf.geo.attributes.position as THREE.BufferAttribute;
      const n = pf.data.length;
      for (let i = 0; i < n; i++) {
        const d = pf.data[i];
        const life = (time * d.sp * 0.3 + d.r * 2.7) % 1;
        const o = d.origin;
        if (pf.mode === "seed") {
          // 具翅种子旋降、落地即止
          const ang = d.ph + life * 7.2;
          const rad = life * pf.spread * (0.45 + d.r);
          arr.setXYZ(i, o.x + Math.cos(ang) * rad, Math.max(0.03, o.y + life * pf.vy), o.z + Math.sin(ang) * rad);
        } else if (pf.mode === "pollen") {
          // 花粉悬浮于花旁，缓慢下沉飘散
          const rad = (0.05 + life * pf.spread) * (0.4 + d.r);
          arr.setXYZ(
            i,
            o.x + Math.cos(d.ph + life * 2.3) * rad,
            o.y + life * pf.vy + Math.sin(time * 0.8 + d.ph) * 0.05,
            o.z + Math.sin(d.ph * 1.3 + life * 2.0) * rad,
          );
        } else {
          // 孢子／游动孢子：轻盈上升飘散
          const rad = life * pf.spread * (0.4 + d.r);
          arr.setXYZ(
            i,
            o.x + Math.cos(d.ph + life * 3.1) * rad,
            o.y + life * pf.vy + Math.sin(time * 0.7 + d.ph) * 0.07,
            o.z + Math.sin(d.ph * 1.7 + life * 2.6) * rad,
          );
        }
      }
      arr.needsUpdate = true;
    }
    {
      const darr = dGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DN; i++) {
        const d = dData[i];
        darr.setXYZ(
          i,
          d.x + Math.sin(time * 0.22 * d.s + i) * 0.35,
          ((d.y + time * 0.06 * d.s) % 3.8),
          d.z + Math.cos(time * 0.19 * d.s + i * 1.3) * 0.35,
        );
      }
      darr.needsUpdate = true;
      dMat.opacity = 0.16 + 0.2 * (0.5 + 0.5 * Math.sin(time * 0.4));
    }
  }

  // 记录叶片尺寸系数（供 update 使用）
  for (const l of leaves) {
    l.swing.userData.sizeK = l.swing.scale.x;
    l.swing.scale.setScalar(1);
  }

  function dispose() {
    for (const d of disposables) d.dispose();
    world.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh || (o as THREE.Points).isPoints) {
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      }
    });
  }

  /* ---------------- 依成熟植株的实际包围盒确定取景 ---------------- */
  ground.userData.noBounds = true;
  dust.userData.noBounds = true;
  update(1, 0);
  world.updateMatrixWorld(true);
  const box = new THREE.Box3();
  world.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.noBounds || m.parent?.userData?.noBounds) return;
    box.expandByObject(m);
  });
  if (box.isEmpty()) box.set(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, H, 1));
  const span = box.max.y - box.min.y;
  const focusY = clamp(box.max.y * 0.45, 0.2, 4);
  const focusR = clamp(span * 1.25 + 1.0, 1.6, 10);
  update(0, 0);

  return {
    group: world,
    anchors,
    focusY,
    focusR,
    releaseColor,
    update,
    dispose,
  };
}

function collectMaterials(o: THREE.Object3D) {
  const mats: THREE.Material[] = [];
  const geos: THREE.BufferGeometry[] = [];
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh) {
      const mat = m.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mats.push(...mat);
      else if (mat) mats.push(mat);
      if (m.geometry) geos.push(m.geometry);
    }
  });
  return [...mats, ...geos] as unknown as { dispose(): void }[];
}

export { GROUPS };
