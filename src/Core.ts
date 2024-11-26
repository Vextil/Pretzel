import * as THREE from "three/webgpu";
import Stats from "stats.js";
import Camera from "./Camera";
import Renderer from "./Renderer";
import World from "./World";
import Multiplayer from "./Multiplayer";
import Physics from "./Physics";
import Player from "./Player";
import Input from "./Input";

export default class Core {
  public static camera: Camera;
  public static renderer: Renderer;
  public static input: Input;
  public static world: World;
  public static player: Player;
  public static multiplayer: Multiplayer;
  public static physics: Physics;

  public static canvas = document.getElementById("canvas") as HTMLCanvasElement;
  public static scene = new THREE.Scene();

  private static stats = new Stats();
  private static statsRender = new Stats.Panel("FPS", "#ff8", "#221");
  private static statsRenderTime = new Stats.Panel("ms", "#ff8", "#221");

  private static maxRender = 0;
  private static maxRenderTime = 0;

  private static renderClock = new THREE.Clock(true);
  private static renderTimeClock = new THREE.Clock();

  static init() {
    document.body.appendChild(this.stats.dom);
    this.stats.showPanel(3);
    this.stats.addPanel(this.statsRender);
    this.stats.addPanel(this.statsRenderTime);

    this.camera = new Camera();
    this.renderer = new Renderer();
    this.input = new Input();
    this.world = new World();
    this.player = new Player();
    this.multiplayer = new Multiplayer();
    this.physics = new Physics();

    this.physics.addScene(this.scene);
    requestAnimationFrame(() => this.renderUpdate());
  }

  static async renderUpdate() {
    requestAnimationFrame(() => this.renderUpdate());

    let deltaTime = this.renderClock.getDelta();
    if (deltaTime > this.maxRender) {
      this.maxRender = deltaTime;
    }
    if (deltaTime > 0) {
      this.statsRender.update(1 / deltaTime, 150);
    }
    this.renderTimeClock.start();

    this.camera.update(deltaTime);
    this.player.update(deltaTime);
    this.physics.step(deltaTime);
    await this.renderer.update();

    this.renderTimeClock.stop();
    const time = this.renderTimeClock.getElapsedTime() * 1000;
    if (time > this.maxRenderTime) {
      this.maxRenderTime = time;
    }
    this.statsRenderTime.update(time, this.maxRenderTime);
  }
}

Core.init();
