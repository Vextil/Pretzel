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

  private static renderClock = new THREE.Clock(true);

  static init() {
    document.body.appendChild(this.stats.dom);

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

    this.player.update(deltaTime);
    this.physics.step(deltaTime);
    this.camera.update(deltaTime);
    await this.renderer.update();

    this.stats.update();
  }
}

Core.init();
