import Core from "./Core";
import * as THREE from "three/webgpu";

export default class World {
  constructor() {
    Core.scene.background = new THREE.Color(0x151729);

    const loader = new THREE.TextureLoader();
    const texChecker = this.pixelTexture(loader.load("checker.png"));
    texChecker.repeat.set(3, 3);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(1000, 0.1, 1000),
      new THREE.MeshPhysicalMaterial({ map: texChecker })
    );
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.castShadow = true;
    floor.userData.physics = { mass: 0 };
    Core.scene.add(floor);

    Core.scene.add(new THREE.AmbientLight(0x757f8e, 3));

    const spotLight = new THREE.SpotLight(
      0xffc100,
      20,
      100,
      Math.PI / 4,
      0.02,
      1
    );
    spotLight.position.set(3, 10, 0);
    const target = spotLight.target;
    Core.scene.add(target);
    target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.001;
    Core.scene.add(spotLight);

    // Core.scene.add(new THREE.CameraHelper(spotLight.shadow.camera));

    Core.scene.add(spotLight);

    const capsuleMesh = new THREE.BoxGeometry(1, 1);
    const capsuleMaterial = new THREE.MeshPhongMaterial({
      color: 0x68b7e9,
      emissive: 0x4f7e8b,
      shininess: 10,
      specular: 0xffffff,
      map: texChecker,
    });
    for (let i = 0; i < 10; i++) {
      const capsule = new THREE.Mesh(capsuleMesh, capsuleMaterial);
      capsule.position.y = 10 + i;
      capsule.rotateX(Math.random() * Math.PI * 2);
      capsule.userData.physics = { mass: 1 };
      capsule.castShadow = true;
      capsule.receiveShadow = true;
      Core.scene.add(capsule);
    }
  }

  pixelTexture(texture: THREE.Texture) {
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
