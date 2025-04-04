import * as THREE from "three/webgpu";

interface MouseInput {
  x: number;
  y: number;
}

export default class Camera {
  // Camera and scene objects
  public instance: THREE.PerspectiveCamera;
  private target: THREE.Object3D | null;
  private domElement: HTMLElement;

  // Input tracking
  private mouseInput: MouseInput;

  constructor() {
    this.instance = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.target = null;
    this.domElement = document.body;

    // Input tracking
    this.mouseInput = {
      x: 0,
      y: 0,
    };

    // Bind methods
    this.onMouseMove = this.onMouseMove.bind(this);
    this.update = this.update.bind(this);

    // Set up event listeners
    this.domElement.addEventListener("mousemove", this.onMouseMove);
  }

  private onMouseMove(event: MouseEvent): void {
    const movementX =
      event.movementX ||
      (event as any).mozMovementX ||
      (event as any).webkitMovementX ||
      0;
    const movementY =
      event.movementY ||
      (event as any).mozMovementY ||
      (event as any).webkitMovementY ||
      0;

    this.mouseInput.x = movementX;
    this.mouseInput.y = movementY;
  }

  public setTarget(target: THREE.Object3D): void {
    this.target = target;
  }

  public update(deltaTime: number): void {
    if (!this.target) return;
    let targetPosition = this.target.position.clone();
    targetPosition.y += 2.5;
  targetPosition.z += 10;
    this.instance.position.lerp(targetPosition, deltaTime * 10);
    this.instance.lookAt(this.target.position);
  }

  public dispose(): void {
    // Clean up event listeners
    this.domElement.removeEventListener("mousemove", this.onMouseMove);
  }
}
