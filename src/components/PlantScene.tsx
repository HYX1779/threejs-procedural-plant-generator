import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildPlant, type Anchor, type PlantModel } from "../lib/botany";
import { classify, stageIndex, type LightPreset, type PlantGroup, type PlantParams } from "../lib/taxonomy";
import { currentMode, THEME_EVENT, type ThemeMode } from "../lib/theme";
import { anchorText } from "../lib/content-i18n";
import type { Lang } from "../lib/i18n";
import { backdropTexture } from "../lib/textures";
import { TAU } from "../lib/parts";

export type SceneControl = { seek: number | null; growth: number };
export type FrameBus = {
  listeners: Set<(g: number, s: number) => void>;
  emit(g: number, s: number): void;
  subscribe(fn: (g: number, s: number) => void): () => void;
};

type Props = {
  params: PlantParams;
  control: SceneControl;
  playing: boolean;
  speed: number;
  loop: boolean;
  bus: FrameBus;
  lang: Lang;
};

type Scheme = "light" | "dark";

const LIGHTS: Record<
  string,
  {
    hemi: [string, string, number];
    key: [string, number, number, number, number];
    rim: [string, number, number, number, number];
    expo: number;
  }
> = {
  noon: {
    hemi: ["#e2f0dd", "#2b1d12", 0.62],
    key: ["#fff5de", 2.15, 4.4, 7.2, 4.2],
    rim: ["#6fe0a4", 0.85, -5.2, 3.2, -4.4],
    expo: 1.04,
  },
  dawn: {
    hemi: ["#cfe2ea", "#2a2018", 0.55],
    key: ["#ffd7a3", 1.95, -6.2, 3.6, 4.4],
    rim: ["#7fb2ff", 0.6, 5, 2, -4],
    expo: 1.0,
  },
  dusk: {
    hemi: ["#c0a892", "#180f0a", 0.42],
    key: ["#ff9a56", 1.85, 5.4, 2.6, -3.2],
    rim: ["#5c8fe0", 0.7, -4.6, 3.4, 4.2],
    expo: 1.12,
  },
};

/* 视口背景／雾／标尺随明暗模式切换 */
const FOG: Record<Scheme, Record<LightPreset, string>> = {
  light: { dawn: "#ded2e2", noon: "#e9e0ea", dusk: "#e5d8dd" },
  dark: { dawn: "#171019", noon: "#18121c", dusk: "#171014" },
};
const SCENE_TONE: Record<Scheme, { ring: number; fill: number; fogDensity: number }> = {
  light: { ring: 0x815c94, fill: 0xa987bb, fogDensity: 0.03 },
  dark: { ring: 0xb08fc0, fill: 0x9a77ad, fogDensity: 0.042 },
};

const BUILD_IGNORED = new Set(["wind", "autoRotate", "showLabels", "light"]);
const buildKey = (p: PlantParams) =>
  JSON.stringify(p, (k, v) => (BUILD_IGNORED.has(k) ? undefined : v));

type Label = { a: Anchor; el: HTMLDivElement; op: string; tr: string };

export default function PlantScene({ params, control, playing, speed, loop, bus, lang }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<Label[]>([]);
  const propsRef = useRef({ params, control, playing, speed, loop, bus, lang });
  propsRef.current = { params, control, playing, speed, loop, bus, lang };
  const dirtyRef = useRef(true);

  useEffect(() => {
    dirtyRef.current = true;
  }, [params]);

  // 切换语言时只更新标注文字，不重建模型
  useEffect(() => {
    for (const L of labelsRef.current) {
      const text = anchorText(L.a, lang);
      const b = L.el.querySelector("b");
      const i = L.el.querySelector("i");
      if (b) b.textContent = text.label;
      if (i) i.textContent = text.sub;
    }
  }, [lang]);

  useEffect(() => {
    const mount = mountRef.current!;
    const overlay = overlayRef.current!;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
    camera.position.set(3.4, 2.8, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    // 小屏设备降低像素比与阴影分辨率，减少填充率压力
    const smallScreen = window.matchMedia("(max-width: 760px)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, smallScreen ? 1.6 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.4;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI * 0.54;
    controls.minPolarAngle = Math.PI * 0.05;
    controls.target.set(0, 1.1, 0);
    controls.autoRotateSpeed = 0.65;

    /* ---------------- 灯光 ---------------- */
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.castShadow = true;
    key.shadow.mapSize.setScalar(smallScreen ? 512 : 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -5.5;
    key.shadow.camera.right = 5.5;
    key.shadow.camera.top = 6.5;
    key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.022;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.7);
    scene.add(rim);
    const fill = new THREE.PointLight(0xb59ac6, 5, 16, 2);
    fill.position.set(0.4, 1.4, 3);
    scene.add(fill);

    /* ---------------- 标本盘刻度环 ---------------- */
    const ringLineMat = new THREE.LineBasicMaterial({ color: 0x93c79e, transparent: true, opacity: 0.22 });
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x93c79e,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    });
    {
      const pts: number[] = [];
      const R = 3.05;
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * TAU;
        const long = i % 8 === 0;
        pts.push(
          Math.cos(a) * R, 0.006, Math.sin(a) * R,
          Math.cos(a) * (R + (long ? 0.24 : 0.1)), 0.006, Math.sin(a) * (R + (long ? 0.24 : 0.1)),
        );
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      scene.add(new THREE.LineSegments(g, ringLineMat));
      const circ = new THREE.Mesh(new THREE.RingGeometry(R - 0.01, R + 0.01, 128), ringMat);
      circ.rotation.x = -Math.PI / 2;
      circ.position.y = 0.005;
      scene.add(circ);
    }

    /* ---------------- 主题（系统自动 / 手动日间·夜间） ---------------- */
    let scheme: Scheme = currentMode();
    let lastLight: LightPreset | null = null;

    const applyLight = (preset: LightPreset) => {
      const L = LIGHTS[preset] ?? LIGHTS.noon;
      const tone = SCENE_TONE[scheme];
      hemi.color.set(L.hemi[0]);
      hemi.groundColor.set(L.hemi[1]);
      hemi.intensity = L.hemi[2];
      key.color.set(L.key[0]);
      key.intensity = L.key[1];
      key.position.set(L.key[2], L.key[3], L.key[4]);
      rim.color.set(L.rim[0]);
      rim.intensity = L.rim[1];
      rim.position.set(L.rim[2], L.rim[3], L.rim[4]);
      fill.color.setHex(tone.fill);
      fill.intensity = scheme === "light" ? 3.4 : 5;
      scene.background = backdropTexture(preset, scheme);
      scene.fog = new THREE.FogExp2(FOG[scheme][preset], tone.fogDensity);
      ringLineMat.color.setHex(tone.ring);
      ringMat.color.setHex(tone.ring);
      ringLineMat.opacity = scheme === "light" ? 0.3 : 0.22;
      ringMat.opacity = scheme === "light" ? 0.2 : 0.16;
      renderer.toneMappingExposure = L.expo;
      lastLight = preset;
    };
    applyLight(propsRef.current.params.light);

    const onSchemeChange = (e: Event) => {
      const next = (e as CustomEvent<ThemeMode>).detail;
      if (next !== "light" && next !== "dark") return;
      if (next === scheme) return;
      scheme = next;
      applyLight(lastLight ?? propsRef.current.params.light);
    };
    window.addEventListener(THEME_EVENT, onSchemeChange);

    /* ---------------- 植物模型 ---------------- */
    let model: PlantModel | null = null;
    let labels: Label[] = [];
    const desiredTarget = new THREE.Vector3(0, 1.1, 0);
    let firstBuild = true;
    let lastGroupId = "";
    let lastBuildKey = "";
    let userTook = false;
    controls.addEventListener("start", () => {
      userTook = true;
    });

    const rebuild = () => {
      const prm = propsRef.current.params;
      const nextKey = buildKey(prm);
      const sameBuild = nextKey === lastBuildKey;

      // 风、自动旋转、标注、光照不改变模型结构；避免无谓的整株重建
      if (sameBuild) {
        if (prm.light !== lastLight) applyLight(prm.light);
        return;
      }
      lastBuildKey = nextKey;

      const grp: PlantGroup = classify(prm);
      if (model) {
        scene.remove(model.group);
        model.dispose();
        model = null;
      }
      let built: PlantModel;
      try {
        built = buildPlant(prm, grp);
      } catch (err) {
        console.error("[phytogenesis] 构建失败", err);
        return;
      }
      model = built;
      model.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.Material | THREE.Material[];
        const tr = Array.isArray(mat) ? mat.some((x) => x.transparent) : !!mat?.transparent;
        m.castShadow = !tr; // 透明基质（根箱／水体）不投影，避免遮蔽地下部分
      });
      scene.add(model.group);
      desiredTarget.set(0, model.focusY, 0);
      if (firstBuild || grp.id !== lastGroupId) {
        userTook = false;
        firstBuild = false;
        lastGroupId = grp.id;
      }
      applyLight(prm.light);

      overlay.querySelectorAll(".anno").forEach((n) => n.remove());
      labels = model.anchors.map((a) => {
        const el = document.createElement("div");
        el.className = "anno";
        el.innerHTML =
          '<span class="anno-line"></span><span class="anno-box"><b></b><i></i></span><span class="anno-dot"></span>';
        const text = anchorText(a, propsRef.current.lang);
        el.querySelector("b")!.textContent = text.label;
        el.querySelector("i")!.textContent = text.sub;
        el.style.opacity = "0";
        overlay.appendChild(el);
        return { a, el, op: "0", tr: "" };
      });
      labelsRef.current = labels;
    };
    rebuild();
    dirtyRef.current = false;

    /* ---------------- 尺寸 ---------------- */
    let viewW = 1;
    let viewH = 1;
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      viewW = w;
      viewH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    // 移动端向下滚动、视口离开屏幕时停止渲染，省电省 GPU
    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
      },
      { threshold: 0.01 },
    );
    io.observe(mount);

    /* ---------------- 主循环 ---------------- */
    const clock = new THREE.Clock();
    const wp = new THREE.Vector3();
    const sp = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    let raf = 0;
    let elapsed = 0;
    let holdAt = 0;
    let overlayOn: boolean | null = null;
    let autoRotate: boolean | null = null;
    let lastRebuildAt = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const pr = propsRef.current;

      if (!onScreen) {
        clock.getDelta();
        return;
      }

      // 拖动滑块时合并重建（约 12 次/秒），避免每帧重新生成整株与纹理
      if (dirtyRef.current) {
        const now = performance.now();
        if (now - lastRebuildAt > 80) {
          lastRebuildAt = now;
          dirtyRef.current = false;
          rebuild();
        }
      }
      if (!model) return;

      const ctl = pr.control;
      let g = ctl.growth;
      if (ctl.seek !== null) {
        g = ctl.seek;
        ctl.seek = null;
        holdAt = 0;
      } else if (pr.playing) {
        if (g >= 1) {
          holdAt += dt;
          if (pr.loop && holdAt > 1.4) {
            g = 0;
            holdAt = 0;
          }
        } else {
          g = Math.min(1, g + dt * pr.speed * 0.075);
        }
      }
      ctl.growth = g;
      model.update(g, elapsed, pr.params.wind);

      const wantRotate = pr.params.autoRotate;
      if (wantRotate !== autoRotate) {
        autoRotate = wantRotate;
        controls.autoRotate = wantRotate;
      }
      // 取景随生长推移：幼苗期贴近种子，成株后缓缓拉开（用户一旦操作即让位）
      if (!userTook) {
        let gr = THREE.MathUtils.clamp((g - 0.02) / 0.34, 0, 1);
        gr = gr * gr * (3 - 2 * gr);
        desiredTarget.set(0, 0.12 + (model.focusY - 0.12) * gr, 0);
        controls.target.lerp(desiredTarget, 1 - Math.pow(0.006, dt));
        const want = THREE.MathUtils.clamp(model.focusR * (0.56 + 0.44 * gr), 1.4, 10);
        camDir.copy(camera.position).sub(controls.target).normalize();
        const cur = camera.position.distanceTo(controls.target);
        const d = THREE.MathUtils.lerp(cur, want, 1 - Math.pow(0.06, dt));
        camera.position.copy(controls.target).addScaledVector(camDir, d);
      }
      controls.update();
      renderer.render(scene, camera);

      /* 标注 */
      const showLabels = pr.params.showLabels;
      if (showLabels !== overlayOn) {
        overlayOn = showLabels;
        overlay.style.opacity = showLabels ? "1" : "0";
      }
      if (showLabels) {
        for (const L of labels) {
          const a = L.a;
          const inWin = g >= a.from && g <= a.to;
          if (!inWin) {
            if (L.op !== "0") {
              L.el.style.opacity = "0";
              L.op = "0";
            }
            continue;
          }
          a.node.getWorldPosition(wp);
          sp.copy(wp).project(camera);
          if (sp.z > 1) {
            if (L.op !== "0") {
              L.el.style.opacity = "0";
              L.op = "0";
            }
            continue;
          }
          const x = (sp.x * 0.5 + 0.5) * viewW;
          const y = (-sp.y * 0.5 + 0.5) * viewH;
          const fade = Math.min(1, (g - a.from) * 9) * Math.min(1, (a.to - g) * 9);
          const tr = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
          if (tr !== L.tr) {
            L.el.style.transform = tr;
            L.tr = tr;
          }
          const op = String(Math.max(0, Math.min(1, fade)));
          if (op !== L.op) {
            L.el.style.opacity = op;
            L.op = op;
          }
        }
      }

      pr.bus.emit(g, stageIndex(g));
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener(THEME_EVENT, onSchemeChange);
      controls.dispose();
      if (model) model.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh || (o as THREE.Points).isPoints || (o as THREE.LineSegments).isLineSegments) {
          m.geometry?.dispose?.();
          const mat = m.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat?.dispose?.();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-[8] overflow-hidden transition-opacity duration-300"
      />
    </div>
  );
}
