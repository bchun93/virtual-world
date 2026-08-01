import * as THREE from "three";
import type { GameMap } from "../types";
import { TILE_WORLD } from "./controller3d";

export interface WorldScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  player: THREE.Group;
  grass: THREE.Object3D[];
  dispose: () => void;
}

function makePlayer(): THREE.Group {
  const g = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf2c97a,
    roughness: 0.45,
    metalness: 0.1,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0d2a3a,
    roughness: 0.6,
  });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 4, 10), bodyMat);
  torso.position.y = 0.7;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), bodyMat);
  head.position.y = 1.25;
  head.castShadow = true;
  g.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), accentMat);
  visor.position.set(0, 1.28, 0.16);
  g.add(visor);

  return g;
}

function addGrassClump(parent: THREE.Group, x: number, z: number): THREE.Object3D[] {
  const blades: THREE.Object3D[] = [];
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6fbf8a,
    roughness: 0.85,
  });
  for (let i = 0; i < 7; i++) {
    const h = 0.45 + Math.random() * 0.55;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, h, 4), mat);
    blade.position.set(
      x + (Math.random() - 0.5) * 1.2,
      h / 2,
      z + (Math.random() - 0.5) * 1.2,
    );
    blade.rotation.y = Math.random() * Math.PI;
    blade.rotation.z = (Math.random() - 0.5) * 0.25;
    blade.castShadow = true;
    parent.add(blade);
    blades.push(blade);
  }
  return blades;
}

export function createWorldScene(
  canvas: HTMLCanvasElement,
  map: GameMap,
): WorldScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a2433);
  scene.fog = new THREE.Fog(0x0a2433, 18, 42);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 10, 12);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Lights
  const hemi = new THREE.HemisphereLight(0x9fd0d8, 0x2a5548, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2a8, 1.35);
  sun.position.set(12, 22, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  const root = new THREE.Group();
  scene.add(root);

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x3d7a55,
    roughness: 0.92,
  });
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0x4a8a62,
    roughness: 0.9,
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a42,
    roughness: 0.75,
    metalness: 0.05,
  });
  const grassTileMat = new THREE.MeshStandardMaterial({
    color: 0x2f6b45,
    roughness: 0.95,
  });

  const grass: THREE.Object3D[] = [];

  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const tile = map.tiles[ty][tx];
      const wx = (tx + 0.5) * TILE_WORLD;
      const wz = (ty + 0.5) * TILE_WORLD;

      if (tile === 1) {
        const rock = new THREE.Mesh(
          new THREE.BoxGeometry(TILE_WORLD * 0.95, 1.4, TILE_WORLD * 0.95),
          rockMat,
        );
        rock.position.set(wx, 0.7, wz);
        rock.castShadow = true;
        rock.receiveShadow = true;
        root.add(rock);
        continue;
      }

      const mat = tile === 2 ? grassTileMat : tx % 2 === ty % 2 ? groundMat : pathMat;
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(TILE_WORLD, 0.2, TILE_WORLD),
        mat,
      );
      floor.position.set(wx, -0.1, wz);
      floor.receiveShadow = true;
      root.add(floor);

      if (tile === 2) {
        grass.push(...addGrassClump(root, wx, wz));
      }
    }
  }

  // Soft ground plane under everything for horizon fill
  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(map.width * TILE_WORLD * 3, map.height * TILE_WORLD * 3),
    new THREE.MeshStandardMaterial({ color: 0x16384a, roughness: 1 }),
  );
  under.rotation.x = -Math.PI / 2;
  under.position.y = -0.21;
  under.receiveShadow = true;
  scene.add(under);

  const player = makePlayer();
  scene.add(player);

  const dispose = () => {
    renderer.dispose();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) m.dispose();
      }
    });
  };

  return { scene, camera, renderer, player, grass, dispose };
}

export function resizeRenderer(
  world: WorldScene,
  width: number,
  height: number,
): void {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  world.camera.aspect = w / h;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(w, h, false);
}

export function updateCamera(
  camera: THREE.PerspectiveCamera,
  playerX: number,
  playerZ: number,
  yaw: number,
  dt: number,
): void {
  const dist = 7.5;
  const height = 5.2;
  const behindX = playerX - Math.sin(yaw) * dist * 0.15 - Math.sin(0) * 0;
  // Elevated chase cam slightly behind facing
  const targetX = playerX - Math.sin(yaw) * 4.5;
  const targetZ = playerZ - Math.cos(yaw) * 4.5;
  const desired = new THREE.Vector3(targetX, height, targetZ + 0.01);
  // Bias toward a readable angled view
  desired.x = THREE.MathUtils.lerp(desired.x, playerX - 3.5, 0.35);
  desired.z = THREE.MathUtils.lerp(desired.z, playerZ + 6.5, 0.35);

  camera.position.lerp(desired, 1 - Math.exp(-6 * dt));
  const look = new THREE.Vector3(playerX, 0.9, playerZ);
  camera.lookAt(look);
  void behindX;
}
