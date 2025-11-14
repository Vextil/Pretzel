import * as THREE from "three/webgpu";
import Core from "./Core";

export default class Player {
  private capsule: THREE.Mesh;

  constructor() {
    const capsuleMesh = new THREE.CapsuleGeometry(0.7, 1.65, 100, 100);
    const capsuleMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b4f7e,
      emissive: 0x4f7e8b,
      shininess: 10,
      specular: 0xffffff,
    });
    this.capsule = new THREE.Mesh(capsuleMesh, capsuleMaterial);
    this.capsule.position.y = 2;
    this.capsule.userData.physics = { mass: 1, locked: true };
    this.capsule.castShadow = true;
    this.capsule.receiveShadow = true;
    Core.scene.add(this.capsule);

    Core.camera.setTarget(this.capsule);
  }

  public update(deltaTime: number) {
    let currentVelocity = Core.physics.getMeshVelocity(this.capsule);
    let xVelocity = currentVelocity.x;
    let zVelocity = currentVelocity.z;
    let yVelocity = currentVelocity.y;
    let speed = 20 * deltaTime;
    if (Core.input.isKeyDown("w")) {
      zVelocity -= speed;
    }
    if (Core.input.isKeyDown("s")) {
      zVelocity += speed;
    }
    if (Core.input.isKeyDown("a")) {
      xVelocity -= speed;
    }
    if (Core.input.isKeyDown("d")) {
      xVelocity += speed;
    }
    if (Core.input.isKeyDown(" ") && yVelocity === 0) {
      yVelocity = 20;
    }
    if (xVelocity !== 0 || yVelocity !== 0 || zVelocity !== 0) {
      Core.physics.setMeshVelocity(
        this.capsule,
        new THREE.Vector3(xVelocity, yVelocity, zVelocity)
      );
    }
  }
}
