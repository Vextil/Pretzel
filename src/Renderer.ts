import Core from "./Core";
import * as THREE from "three/webgpu";
import { pixelationPass } from "three/addons/tsl/display/PixelationPassNode.js";

export default class Renderer {
  public instance: THREE.WebGPURenderer;
  private postProcessing: THREE.PostProcessing;

  constructor() {
    this.instance = new THREE.WebGPURenderer({
      canvas: Core.canvas,
      powerPreference: "high-performance",
      antialias: false,
    });
    this.instance.setSize(window.innerWidth, window.innerHeight);
    if (window.devicePixelRatio > 1) {
      this.instance.setPixelRatio(1);
    } else {
      this.instance.setPixelRatio(window.devicePixelRatio);
    }
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.instance.init();

    this.postProcessing = new THREE.PostProcessing(this.instance);
    const scenePass = pixelationPass(
      Core.scene,
      Core.camera.instance,
      new THREE.UniformNode(1),
      new THREE.UniformNode(1),
      new THREE.UniformNode(1),
    );
    this.postProcessing.outputNode = scenePass;
    window.addEventListener("resize", () => {
      this.instance.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public async update() {
    this.postProcessing.render();
  }
}
