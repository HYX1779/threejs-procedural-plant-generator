import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Corolla, FruitType, LeafShape } from "./taxonomy";
import { leafTexture, mix, petalTexture, shade, clamp01, seedTexture } from "./textures";

export const TAU = Math.PI * 2;
export function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}
export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
}
export function ease(t: number) {
  return 1 - Math.pow(1 - clamp01(t), 3);
}
export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ==========================================================
   叶形轮廓函数：返回 t∈[0,1] 处的半宽系数（0–1）
   ========================================================== */
function rawProfile(shape: LeafShape, t: number) {
  const e = 1e-3;
  const tt = clamp01(t);
  switch (shape) {
    case "ovate":
      return Math.pow(tt + e, 0.55) * Math.pow(1 - tt + e, 1.12);
    case "lanceolate":
      return Math.pow(tt + e, 0.48) * Math.pow(1 - tt + e, 2.0);
    case "elliptic":
      return Math.pow(Math.max(0, tt * (1 - tt)), 0.6);
    case "obovate":
      return Math.pow(tt + e, 1.55) * Math.pow(1 - tt + e, 0.5);
    case "cordate":
      return Math.pow(tt + e, 0.3) * Math.pow(1 - tt + e, 1.5);
    case "linear":
      return Math.min(1, Math.pow(Math.max(0, tt * (1 - tt)), 0.16) * 1.06);
    case "needle":
      return Math.min(1, Math.pow(Math.max(0, tt * (1 - tt)), 0.1) * 1.03);
    default:
      return Math.min(1, Math.pow(Math.max(0, tt * (1 - tt)), 0.6) * 2);
  }
}

const normCache = new Map<string, number>();
function normMax(shape: LeafShape) {
  const hit = normCache.get(shape);
  if (hit) return hit;
  let m = 0;
  for (let i = 0; i <= 60; i++) m = Math.max(m, rawProfile(shape, i / 60));
  normCache.set(shape, m || 1);
  return m || 1;
}

export function isRadialLeaf(shape: LeafShape) {
  return shape === "palmate" || shape === "fan";
}

export type LeafOpts = {
  shape: LeafShape;
  length: number;
  width: number;
  curl?: number;
  droop?: number;
  twist?: number;
  fold?: number;
  lobes?: number;
  lobeDepth?: number;
  segU?: number;
  segV?: number;
};

/* 叶片／花瓣通用曲面：局部空间中沿 +Y 伸展，上表面法线为 +Z */
export function leafGeometry(o: LeafOpts): THREE.BufferGeometry {
  const segU = o.segU ?? 26;
  const segV = o.segV ?? 14;
  const L = o.length;
  const W = o.width;
  const curl = o.curl ?? 0;
  const droop = o.droop ?? 0;
  const twist = o.twist ?? 0;
  const fold = o.fold ?? 0;
  const lobes = o.lobes ?? 0;
  const lobeDepth = o.lobeDepth ?? 0.5;
  const radial = isRadialLeaf(o.shape);

  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const nrm = normMax(o.shape);

  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * 2 - 1;
      let x: number, y: number, z: number;

      if (radial) {
        const spread = Math.PI * (o.shape === "fan" ? 0.52 : 0.44);
        const ang = v * spread;
        let edge = 1;
        if (o.shape === "palmate" && lobes > 0) {
          const n = Math.max(2, Math.round(lobes / 2));
          edge = 1 + lobeDepth * 0.44 * Math.cos(n * Math.PI * v);
        } else if (o.shape === "palmate") {
          edge = 1 + 0.22 * Math.cos(2 * Math.PI * v);
        } else {
          // 扇形（银杏）：先端中央缺刻
          edge = 1 - 0.3 * Math.exp(-Math.pow(v * 3.1, 2)) * (0.5 + lobeDepth);
        }
        edge = clamp(edge, 0.22, 1.5);
        const rad = u * L * edge;
        x = Math.sin(ang) * rad;
        y = Math.cos(ang) * rad;
        z = curl * W * v * v * 0.6 - u * u * droop * L * 0.45;
      } else {
        let w = rawProfile(o.shape, u) / nrm;
        if (lobes > 0) {
          const cut = Math.pow(Math.abs(Math.sin(lobes * Math.PI * u * 0.5 + 0.0001)), 0.45);
          w *= 1 - lobeDepth * 0.72 * (1 - cut);
        }
        const hw = w * W;
        x = v * hw;
        y = u * L;
        z = curl * hw * v * v + fold * hw * Math.abs(v) * -1 + 0.035 * W * (1 - v * v);
      }

      // 扭曲（禾本科叶片的螺旋下垂）
      if (twist) {
        const a = twist * u * Math.PI;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const nx = x * c - z * s;
        const nz = x * s + z * c;
        x = nx;
        z = nz;
      }
      // 下垂弯折（绕 X 轴）
      if (droop) {
        const a = -droop * Math.pow(u, 1.7) * 1.35;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const ny = y * c - z * s;
        const nz = y * s + z * c;
        y = ny;
        z = nz;
      }

      pos.push(x, y, z);
      uvs.push((v + 1) / 2, u);
    }
  }
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j;
      const b = a + segV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ==========================================================
   渐缩管（茎、枝、根、蒴柄）— 索引按环排列，可用 drawRange 生长
   ========================================================== */
export function taperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  tubular: number,
  radial: number,
  radiusAt: (t: number) => number,
) {
  const frames = curve.computeFrenetFrames(tubular, false);
  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, P);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = Math.max(0.0008, radiusAt(t));
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const cx = Math.cos(a);
      const sx = Math.sin(a);
      const nx = cx * N.x + sx * B.x;
      const ny = cx * N.y + sx * B.y;
      const nz = cx * N.z + sx * B.z;
      pos.push(P.x + r * nx, P.y + r * ny, P.z + r * nz);
      uvs.push(t * 4, j / radial);
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      // 顺时针绕序，法线朝外
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.userData.ringIndices = tubular * radial * 6;
  g.userData.rings = tubular;
  return g;
}

/* 一条自然的茎曲线 */
export function stemCurve(
  height: number,
  rnd: () => number,
  style: "erect" | "rosette" | "tufted" | "branched" | "climbing",
  lean = 0,
  phase = 0,
) {
  const pts: THREE.Vector3[] = [];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let x = 0;
    let z = 0;
    let y = t * height;
    if (style === "climbing") {
      const a = phase + t * Math.PI * 3.2;
      const r = 0.55 * (1 - t * 0.35);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = t * height;
    } else if (style === "rosette") {
      x = Math.sin(phase) * t * t * height * 0.1;
      z = Math.cos(phase) * t * t * height * 0.1;
    } else {
      x = Math.sin(t * 2.1 + phase) * 0.055 * height + lean * t * t * height * 0.12;
      z = Math.cos(t * 1.7 + phase * 1.3) * 0.045 * height;
    }
    x += (rnd() - 0.5) * 0.012 * height;
    z += (rnd() - 0.5) * 0.012 * height;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4);
}

/* ==========================================================
   花
   ========================================================== */
export type FlowerOpts = {
  petalShape: LeafShape;
  petalCount: number;
  corolla: Corolla;
  size: number;
  petalColor: string;
  petalColor2: string;
  centerColor: string;
  stamenCount: number;
  rnd: () => number;
};

export type FlowerParts = {
  group: THREE.Group;
  petals: THREE.Object3D[]; // 每片花瓣的开合枢轴
  budScale: THREE.Object3D;
  stamens: THREE.Object3D[];
  antherMat: THREE.MeshStandardMaterial;
  pistil: THREE.Object3D;
};

export function buildFlower(o: FlowerOpts): FlowerParts {
  const g = new THREE.Group();
  const S = o.size;
  const petals: THREE.Object3D[] = [];
  const stamens: THREE.Object3D[] = [];
  const bake = (parts: THREE.BufferGeometry[]) => {
    const merged = parts.length ? mergeGeometries(parts, false) : null;
    parts.forEach((x) => x.dispose());
    return merged;
  };
  const rz = new THREE.Matrix4();
  const rx = new THREE.Matrix4();
  const mt = new THREE.Matrix4();

  const petalMat = new THREE.MeshStandardMaterial({
    map: petalTexture(o.petalColor, o.petalColor2),
    side: THREE.DoubleSide,
    roughness: 0.42,
    metalness: 0,
    color: 0xffffff,
  });
  const sepalMat = new THREE.MeshStandardMaterial({
    map: leafTexture({ vein: "reticulate", base: "#4c7a34", tip: "#7fae48" }),
    side: THREE.DoubleSide,
    roughness: 0.7,
  });
  const antherMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(o.centerColor).multiplyScalar(0.85),
    roughness: 0.5,
  });
  const pistilMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shade(o.centerColor, -0.25)),
    roughness: 0.45,
  });

  // ---- 花萼（合并为单一网格） ----
  const sepalCount = Math.max(3, Math.round(o.petalCount));
  {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < sepalCount; i++) {
      const geo = leafGeometry({
        shape: o.petalShape === "linear" ? "lanceolate" : o.petalShape,
        length: S * 0.55,
        width: S * 0.11,
        curl: 0.4,
        droop: 0.25,
        segU: 8,
        segV: 5,
      });
      geo.applyMatrix4(mt.copy(rz.makeRotationZ((i / sepalCount) * TAU + Math.PI / sepalCount)).multiply(rx.makeRotationX(-0.42)));
      parts.push(geo);
    }
    const merged = bake(parts);
    if (merged) {
      const m = new THREE.Mesh(merged, sepalMat);
      m.castShadow = true;
      g.add(m);
    }
  }

  const budScale = new THREE.Group();
  g.add(budScale);

  // ---- 花冠 ----
  if (o.corolla === "fused") {
    const len = S * 1.05;
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const r = S * (0.1 + 0.52 * Math.pow(t, 2.4));
      prof.push(new THREE.Vector2(Math.max(0.004, r), t * len));
    }
    const geo = new THREE.LatheGeometry(prof, 40);
    // 花冠裂片：口部起伏
    const p = geo.attributes.position as THREE.BufferAttribute;
    const n = Math.max(3, o.petalCount);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const k = clamp01((y / len - 0.55) / 0.45);
      if (k > 0) {
        const ang = Math.atan2(z, x);
        const rr = Math.hypot(x, z) * (1 + 0.26 * k * Math.cos(n * ang));
        p.setX(i, Math.cos(ang) * rr);
        p.setZ(i, Math.sin(ang) * rr);
        p.setY(i, y + 0.09 * k * S * Math.cos(n * ang));
      }
    }
    geo.computeVertexNormals();
    const tube = new THREE.Mesh(geo, petalMat);
    tube.rotation.x = Math.PI / 2; // 使花冠轴指向 +Z（花的对称轴）
    tube.castShadow = true;
    budScale.add(tube);
  } else {
    const count = o.corolla === "composite" ? clamp(Math.max(10, o.petalCount * 2), 10, 18) : Math.max(3, o.petalCount);
    const pLen = S * (o.corolla === "composite" ? 1.15 : 0.85);
    const pWid = S * (o.corolla === "composite" ? 0.085 : 0.26);
    const shape: LeafShape =
      o.corolla === "composite" ? "lanceolate" : o.petalShape === "needle" ? "lanceolate" : o.petalShape;
    const petalGeo = leafGeometry({
      shape,
      length: pLen,
      width: pWid,
      curl: o.corolla === "composite" ? 0.75 : 0.35,
      droop: 0.12,
      segU: 14,
      segV: 8,
    });
    for (let i = 0; i < count; i++) {
      const holder = new THREE.Group();
      holder.rotation.z = (i / count) * TAU + (o.corolla === "composite" ? 0.13 : 0);
      const piv = new THREE.Group();
      const mesh = new THREE.Mesh(petalGeo, petalMat);
      mesh.position.y = S * 0.06;
      piv.add(mesh);
      piv.userData.organ = "petal";
      holder.add(piv);
      budScale.add(holder);
      petals.push(piv);
    }
    if (o.corolla === "composite") {
      // 盘心
      const disc = new THREE.Mesh(
        new THREE.SphereGeometry(S * 0.44, 20, 12, 0, TAU, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: shade(o.centerColor, -0.18), roughness: 0.85 }),
      );
      disc.scale.y = 0.62;
      disc.rotation.x = Math.PI / 2;
      budScale.add(disc);
      const dotProto = new THREE.SphereGeometry(S * 0.034, 6, 5);
      const dotMat = new THREE.MeshStandardMaterial({ color: shade(o.centerColor, 0.2), roughness: 0.6 });
      const dotParts: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 40; i++) {
        const a = i * 2.39996;
        const r = S * 0.4 * Math.sqrt(i / 40);
        mt.makeTranslation(Math.cos(a) * r, Math.sin(a) * r, S * (0.2 - 0.16 * (r / (S * 0.4))));
        dotParts.push(dotProto.clone().applyMatrix4(mt));
      }
      dotProto.dispose();
      const dots = bake(dotParts);
      if (dots) budScale.add(new THREE.Mesh(dots, dotMat));
    }
  }

  // ---- 雄蕊（花丝与花药各合并为一个网格） ----
  const sn = clamp(Math.round(o.stamenCount), 0, 26);
  const filMat = new THREE.MeshStandardMaterial({ color: shade(o.petalColor2, -0.1), roughness: 0.6 });
  if (sn > 0) {
    const filProto = new THREE.CylinderGeometry(S * 0.02, S * 0.03, S * 0.62, 5);
    filProto.translate(0, S * 0.31, 0);
    const anthProto = new THREE.SphereGeometry(S * 0.072, 7, 5);
    anthProto.scale(0.62, 1.5, 0.62);
    anthProto.translate(0, S * 0.62, 0);
    const filParts: THREE.BufferGeometry[] = [];
    const anthParts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < sn; i++) {
      mt.copy(rz.makeRotationZ((i / sn) * TAU + 0.2)).multiply(rx.makeRotationX(Math.PI / 2 - (0.3 + o.rnd() * 0.42)));
      filParts.push(filProto.clone().applyMatrix4(mt));
      anthParts.push(anthProto.clone().applyMatrix4(mt));
    }
    filProto.dispose();
    anthProto.dispose();
    const holder = new THREE.Group();
    holder.scale.setScalar(0.001);
    const fm = bake(filParts);
    const am = bake(anthParts);
    if (fm) holder.add(new THREE.Mesh(fm, filMat));
    if (am) {
      const an = new THREE.Mesh(am, antherMat);
      an.userData.organ = "anther";
      holder.add(an);
    }
    holder.userData.organ = "stamen";
    budScale.add(holder);
    stamens.push(holder);
  }

  // ---- 雌蕊（子房＋花柱＋柱头合并） ----
  const pistil = new THREE.Group();
  {
    const ovary = new THREE.SphereGeometry(S * 0.15, 11, 9);
    ovary.scale(1, 1.15, 1);
    const style = new THREE.CylinderGeometry(S * 0.03, S * 0.045, S * 0.4, 6);
    style.translate(0, S * 0.24, 0);
    const stigma = new THREE.SphereGeometry(S * 0.075, 8, 6);
    stigma.scale(1, 0.7, 1);
    stigma.translate(0, S * 0.46, 0);
    rx.makeRotationX(Math.PI / 2);
    const merged = bake([ovary.applyMatrix4(rx), style.applyMatrix4(rx), stigma.applyMatrix4(rx)]);
    if (merged) pistil.add(new THREE.Mesh(merged, pistilMat));
  }
  pistil.scale.setScalar(0.001);
  budScale.add(pistil);

  return { group: g, petals, budScale, stamens, antherMat, pistil };
}

/* ==========================================================
   果实
   ========================================================== */
export function fruitGeometry(type: FruitType, R: number, rnd: () => number) {
  const prof: THREE.Vector2[] = [];
  const P = (t: number) => {
    let r = 0;
    let y = t;
    switch (type) {
      case "berry":
        r = Math.sin(Math.PI * Math.pow(t, 0.92)) ** 0.75;
        break;
      case "drupe":
        r = Math.sin(Math.PI * Math.pow(t, 0.8)) ** 0.7 * (1 - 0.12 * Math.pow(t, 6));
        break;
      case "pome":
        r = Math.sin(Math.PI * Math.pow(t, 0.72)) ** 0.85 * (1 - 0.3 * Math.pow(t, 5));
        y = t * 1.05;
        break;
      case "capsule":
        r = Math.sin(Math.PI * Math.pow(t, 0.7)) ** 0.55 * 0.72;
        y = t * 1.7;
        break;
      case "legume":
        r = Math.sin(Math.PI * Math.pow(t, 0.9)) ** 0.4 * 0.42;
        y = t * 2.6;
        break;
      case "nut":
        r = Math.sin(Math.PI * Math.pow(t, 1.05)) ** 0.8 * (1 - 0.1 * t);
        y = t * 1.12;
        break;
      default:
        r = Math.sin(Math.PI * t) ** 0.8;
    }
    return new THREE.Vector2(Math.max(0.004, r * R), y * R * 2);
  };
  for (let i = 0; i <= 22; i++) prof.push(P(i / 22));
  const g = new THREE.LatheGeometry(prof, type === "nut" ? 12 : 22);

  if (type === "aggregate") {
    // 聚合果：多个小核果聚生于花托
    const grp = new THREE.BufferGeometry();
    return grp; // 占位（由 buildAggregate 处理）
  }

  // 棱／沟
  const p = g.attributes.position as THREE.BufferAttribute;
  if (type === "capsule" || type === "drupe" || type === "pome") {
    const ribs = type === "capsule" ? 5 : type === "drupe" ? 1 : 5;
    const amp = type === "drupe" ? 0.09 : 0.06;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const ang = Math.atan2(z, x);
      const k = 1 + amp * Math.cos(ribs * ang);
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
    g.computeVertexNormals();
  }
  if (type === "legume") {
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setZ(i, p.getZ(i) + Math.sin((y / (R * 5.2)) * Math.PI) * R * 0.4);
    }
    g.computeVertexNormals();
  }
  g.userData.rnd = rnd;
  return g;
}

export function buildAggregateFruit(R: number, color: string) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.34 });
  const recept = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.55, 12, 10, 0, TAU, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: shade(color, -0.4), roughness: 0.8 }),
  );
  recept.scale.y = 0.7;
  grp.add(recept);
  const proto = new THREE.SphereGeometry(R * 0.3, 9, 7);
  const n = 15;
  const parts: THREE.BufferGeometry[] = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const rr = R * 0.52 * Math.sqrt((i + 1) / n);
    pos.set(Math.cos(a) * rr, R * (0.42 - 0.3 * (rr / (R * 0.52))), Math.sin(a) * rr);
    const k = 0.8 + ((i * 37) % 10) / 26;
    scl.set(k, k, k);
    m4.compose(pos, q, scl);
    parts.push(proto.clone().applyMatrix4(m4));
  }
  proto.dispose();
  const merged = mergeGeometries(parts, false);
  parts.forEach((x) => x.dispose());
  if (merged) {
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = true;
    grp.add(m);
  }
  return grp;
}

/* ==========================================================
   球果 / 孢子叶球（裸子植物）
   ========================================================== */
export function buildStrobilus(opts: {
  size: number;
  scales: number;
  color: string;
  female: boolean;
  rnd: () => number;
}) {
  const grp = new THREE.Group();
  const S = opts.size;
  const axisMat = new THREE.MeshStandardMaterial({ color: shade(opts.color, -0.35), roughness: 0.9 });
  const scaleMat = new THREE.MeshStandardMaterial({
    color: opts.color,
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  const h = S * (opts.female ? 2.5 : 1.5);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(S * 0.14, S * 0.2, h, 8), axisMat);
  axis.position.y = h / 2;
  grp.add(axis);

  const scaleGeo = leafGeometry({
    shape: opts.female ? "ovate" : "lanceolate",
    length: S * (opts.female ? 0.85 : 0.5),
    width: S * (opts.female ? 0.26 : 0.14),
    curl: opts.female ? -0.5 : -0.9,
    segU: 6,
    segV: 5,
  });
  const pivots: THREE.Group[] = [];
  const n = opts.scales;
  const seedGeo = new THREE.SphereGeometry(S * 0.13, 8, 6);
  seedGeo.scale(1, 0.72, 1.5);
  const seedMat = new THREE.MeshStandardMaterial({ map: seedTexture("#c9a06a"), roughness: 0.6 });
  const wingGeo = leafGeometry({ shape: "obovate", length: S * 0.75, width: S * 0.17, segU: 6, segV: 4 });
  const wingMat = new THREE.MeshStandardMaterial({
    color: "#cbb489",
    side: THREE.DoubleSide,
    roughness: 0.8,
    transparent: true,
    opacity: 0.92,
  });

  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const y = t * h * 0.94 + h * 0.03;
    const prof = Math.sin(Math.PI * Math.pow(t, 0.72));
    const r = S * (0.2 + prof * (opts.female ? 0.72 : 0.5));
    const a = i * 2.39996;
    const piv = new THREE.Group();
    piv.position.set(Math.cos(a) * r * 0.35, y, Math.sin(a) * r * 0.35);
    piv.rotation.y = -a + Math.PI / 2;
    piv.rotation.x = 0.1; // 闭合：种鳞贴附轴面，上表面（承载胚珠）朝外
    const m = new THREE.Mesh(scaleGeo, scaleMat);
    m.castShadow = true;
    piv.add(m);
    if (opts.female && i % 2 === 0) {
      // 裸露的胚珠／种子 —— 裸子植物的关键特征
      const ov = new THREE.Mesh(seedGeo, seedMat);
      ov.position.set(0, S * 0.02, S * 0.42);
      piv.add(ov);
      if (i % 4 === 0) {
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(0, S * 0.03, S * 0.5);
        wing.rotation.x = 0.25;
        wing.scale.setScalar(0.8);
        piv.add(wing);
      }
    } else if (!opts.female) {
      const pol = new THREE.Mesh(
        new THREE.SphereGeometry(S * 0.06, 6, 5),
        new THREE.MeshStandardMaterial({ color: "#e8c766", roughness: 0.5 }),
      );
      pol.position.set(0, 0, S * 0.3);
      piv.add(pol);
    }
    grp.add(piv);
    pivots.push(piv);
  }
  grp.userData.pivots = pivots;
  grp.userData.height = h;
  return grp;
}

/* ==========================================================
   根系
   ========================================================== */
export function buildRoots(
  kind: "tap" | "fibrous" | "rhizoid" | "none",
  scale: number,
  color: string,
  rnd: () => number,
) {
  const grp = new THREE.Group();
  if (kind === "none") return grp;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const add = (curve: THREE.CatmullRomCurve3, r0: number, r1: number, seg = 8, rad = 5) => {
    const g = taperedTube(curve, seg, rad, (t) => r0 + (r1 - r0) * t);
    const m = new THREE.Mesh(g, mat);
    grp.add(m);
    return m;
  };
  if (kind === "tap") {
    const main = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.05 * scale, 0),
      new THREE.Vector3(0.04 * scale, -0.35 * scale, 0.03 * scale),
      new THREE.Vector3(-0.05 * scale, -0.75 * scale, -0.04 * scale),
      new THREE.Vector3(0.02 * scale, -1.15 * scale, 0.02 * scale),
    ]);
    add(main, 0.075 * scale, 0.008 * scale, 12);
    for (let i = 0; i < 7; i++) {
      const t = 0.15 + i * 0.11;
      const p = main.getPointAt(t);
      const a = i * 2.39996 + rnd();
      const len = (0.35 - i * 0.03) * scale;
      add(
        new THREE.CatmullRomCurve3([
          p.clone(),
          p.clone().add(new THREE.Vector3(Math.cos(a) * len * 0.5, -len * 0.35, Math.sin(a) * len * 0.5)),
          p.clone().add(new THREE.Vector3(Math.cos(a) * len, -len * 0.95, Math.sin(a) * len)),
        ]),
        0.028 * scale,
        0.003 * scale,
        7,
      );
    }
  } else if (kind === "fibrous") {
    const n = 13;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd() * 0.4;
      const len = (0.6 + rnd() * 0.5) * scale;
      const out = (0.18 + rnd() * 0.22) * scale;
      add(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(a) * out * 0.6, -len * 0.35, Math.sin(a) * out * 0.6),
          new THREE.Vector3(Math.cos(a) * out, -len * 0.72, Math.sin(a) * out),
          new THREE.Vector3(Math.cos(a) * out * 0.85, -len, Math.sin(a) * out * 0.85),
        ]),
        0.032 * scale,
        0.002 * scale,
        8,
        4,
      );
    }
  } else {
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd();
      const len = (0.14 + rnd() * 0.2) * scale;
      add(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.02 * scale, 0),
          new THREE.Vector3(Math.cos(a) * len * 0.5, -len * 0.5, Math.sin(a) * len * 0.5),
          new THREE.Vector3(Math.cos(a) * len, -len * 1.1, Math.sin(a) * len),
        ]),
        0.008 * scale,
        0.001 * scale,
        5,
        3,
      );
    }
  }
  return grp;
}

/* ==========================================================
   种子
   ========================================================== */
export function buildSeed(size: number, color: string, winged = false) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: seedTexture(color), roughness: 0.62 });
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const r = Math.sin(Math.PI * Math.pow(t, 0.85)) ** 0.7 * size;
    prof.push(new THREE.Vector2(Math.max(0.002, r), t * size * 2.1 - size));
  }
  const g1 = new THREE.LatheGeometry(prof, 16, 0, Math.PI);
  const g2 = new THREE.LatheGeometry(prof, 16, Math.PI, Math.PI);
  const h1 = new THREE.Group();
  const h2 = new THREE.Group();
  h1.add(new THREE.Mesh(g1, mat));
  h2.add(new THREE.Mesh(g2, mat));
  grp.add(h1, h2);
  if (winged) {
    const w = new THREE.Mesh(
      leafGeometry({ shape: "obovate", length: size * 2.6, width: size * 1.1, segU: 8, segV: 5 }),
      new THREE.MeshStandardMaterial({ color: "#cdb68c", side: THREE.DoubleSide, roughness: 0.85, transparent: true, opacity: 0.9 }),
    );
    w.position.y = size * 1.1;
    w.rotation.x = -0.2;
    grp.add(w);
  }
  grp.userData.halves = [h1, h2];
  return grp;
}

/* 花粉／孢子精灵图 */
let spriteTex: THREE.CanvasTexture | null = null;
export function softSprite() {
  if (spriteTex) return spriteTex;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const c = cv.getContext("2d")!;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  spriteTex = new THREE.CanvasTexture(cv);
  spriteTex.colorSpace = THREE.SRGBColorSpace;
  return spriteTex;
}

export { leafTexture, mix, shade };
