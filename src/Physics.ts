import JoltTypes from "jolt-physics/wasm";
import * as THREE from "three/webgpu";

// const frameRate = 60;

const Jolt = await JoltTypes({});

// Object layers
const LAYER_NON_MOVING = 0;
const LAYER_MOVING = 1;
const NUM_OBJECT_LAYERS = 2;

// const DegreesToRadians = (deg) => deg * (Math.PI / 180.0);
const wrapVec3 = (v: JoltTypes.Vec3 | JoltTypes.RVec3) =>
  new THREE.Vector3(v.GetX(), v.GetY(), v.GetZ());
// const unwrapVec3 = (v) => new Jolt.Vec3(v.x, v.y, v.z);
// const wrapRVec3 = wrapVec3;
// const unwrapRVec3 = (v) => new Jolt.RVec3(v.x, v.y, v.z);
const wrapQuat = (q: JoltTypes.Quat) =>
  new THREE.Quaternion(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
// const unwrapQuat = (q) => new Jolt.Quat(q.x, q.y, q.z, q.w);

export default class Physics {
  private jolt: JoltTypes.JoltInterface;
  private physicsSystem: JoltTypes.PhysicsSystem;
  private bodyInterface: JoltTypes.BodyInterface;

  private meshes: Array<THREE.Mesh> = [];

  private meshMap = new WeakMap<
    THREE.Mesh,
    JoltTypes.Body | JoltTypes.Body[]
  >();

  private _position = new THREE.Vector3();
  private _quaternion = new THREE.Quaternion();
  private _scale = new THREE.Vector3(1, 1, 1);

  private _matrix = new THREE.Matrix4();

  private accumulator = 0.0;

  constructor() {
    const settings = new Jolt.JoltSettings();
    this.setupCollisionFiltering(settings);
    this.jolt = new Jolt.JoltInterface(settings);
    Jolt.destroy(settings);

    this.physicsSystem = this.jolt.GetPhysicsSystem();
    this.physicsSystem.SetGravity(new Jolt.Vec3(0, -32, 0));

    this.bodyInterface = this.physicsSystem.GetBodyInterface();
  }

  private setupCollisionFiltering(settings: JoltTypes.JoltSettings) {
    let objectFilter = new Jolt.ObjectLayerPairFilterTable(NUM_OBJECT_LAYERS);
    objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);
    objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);

    const BP_LAYER_NON_MOVING = new Jolt.BroadPhaseLayer(0);
    const BP_LAYER_MOVING = new Jolt.BroadPhaseLayer(1);
    const NUM_BROAD_PHASE_LAYERS = 2;

    let bpInterface = new Jolt.BroadPhaseLayerInterfaceTable(
      NUM_OBJECT_LAYERS,
      NUM_BROAD_PHASE_LAYERS
    );
    bpInterface.MapObjectToBroadPhaseLayer(
      LAYER_NON_MOVING,
      BP_LAYER_NON_MOVING
    );
    bpInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, BP_LAYER_MOVING);

    settings.mObjectLayerPairFilter = objectFilter;
    settings.mBroadPhaseLayerInterface = bpInterface;
    settings.mObjectVsBroadPhaseLayerFilter =
      new Jolt.ObjectVsBroadPhaseLayerFilterTable(
        settings.mBroadPhaseLayerInterface,
        NUM_BROAD_PHASE_LAYERS,
        settings.mObjectLayerPairFilter,
        NUM_OBJECT_LAYERS
      );
  }

  private getShape(geometry: THREE.BufferGeometry) {
    if (geometry instanceof THREE.BoxGeometry) {
      const parameters = geometry.parameters;
      const sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
      const sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
      const sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;

      return new Jolt.BoxShape(
        new Jolt.Vec3(sx, sy, sz),
        0.05 * Math.min(sx, sy, sz),
        undefined
      );
    } else if (geometry instanceof THREE.SphereGeometry) {
      const parameters = geometry.parameters;
      const radius = parameters.radius !== undefined ? parameters.radius : 1;

      return new Jolt.SphereShape(radius, undefined);
    } else if (geometry instanceof THREE.CapsuleGeometry) {
      const parameters = geometry.parameters;
      const height = parameters.height !== undefined ? parameters.height : 1;
      const radius = parameters.radius !== undefined ? parameters.radius : 1;
      return new Jolt.CapsuleShape(height / 2, radius, undefined);
    } else if (geometry instanceof THREE.IcosahedronGeometry) {
      const parameters = geometry.parameters;
      const radius = parameters.radius !== undefined ? parameters.radius : 1;

      return new Jolt.SphereShape(radius, undefined);
    }

    return null;
  }

  addScene(scene: THREE.Scene) {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const physics = child.userData.physics;
        if (physics) {
          meshes.push(child);
        }
      }
    });

    // Is this necessary for deterministic physics?
    // meshes.sort((a, b) => {
    //   const aKey = `${a.position.x},${a.position.y},${a.position.z}`;
    //   const bKey = `${b.position.x},${b.position.y},${b.position.z}`;
    //   return aKey.localeCompare(bKey);
    // });

    for (const mesh of meshes) {
      const physics = mesh.userData.physics;
      this.addMesh(mesh, physics.mass, physics.restitution, physics.locked);
    }
  }

  addMesh(mesh: THREE.Mesh, mass = 0, restitution = 0, locked = false) {
    const shape = this.getShape(mesh.geometry);

    if (shape === null) return;

    const body =
      mesh instanceof THREE.InstancedMesh
        ? this.createInstancedBody(mesh, mass, restitution, locked, shape)
        : this.createBody(
            mesh.position,
            mesh.quaternion,
            mass,
            restitution,
            locked,
            shape
          );

    if (mass > 0) {
      this.meshes.push(mesh);
      this.meshMap.set(mesh, body);
    }
  }

  createInstancedBody(
    mesh: THREE.InstancedMesh,
    mass: number,
    restitution: number,
    locked: boolean,
    shape: JoltTypes.Shape
  ) {
    const array = mesh.instanceMatrix.array;

    const bodies: Array<JoltTypes.Body> = [];

    for (let i = 0; i < mesh.count; i++) {
      const position = this._position.fromArray(array, i * 16 + 12);
      const quaternion = this._quaternion.setFromRotationMatrix(
        this._matrix.fromArray(array, i * 16)
      );
      bodies.push(
        this.createBody(position, quaternion, mass, restitution, locked, shape)
      );
    }

    return bodies;
  }

  createBody(
    position: THREE.Vector3,
    rotation: THREE.Quaternion,
    mass: number,
    restitution: number,
    locked: boolean,
    shape: JoltTypes.Shape
  ) {
    const pos = new Jolt.RVec3(position.x, position.y, position.z);
    const rot = new Jolt.Quat(rotation.x, rotation.y, rotation.z, rotation.w);

    const motion =
      mass > 0 ? Jolt.EMotionType_Dynamic : Jolt.EMotionType_Static;
    const layer = mass > 0 ? LAYER_MOVING : LAYER_NON_MOVING;

    const creationSettings = new Jolt.BodyCreationSettings(
      shape,
      pos,
      rot,
      motion,
      layer
    );
    creationSettings.mRestitution = restitution;

    if (locked) {
      creationSettings.mAllowedDOFs =
        Jolt.EAllowedDOFs_All &
        ~Jolt.EAllowedDOFs_RotationX &
        ~Jolt.EAllowedDOFs_RotationZ;
    }

    const body = this.bodyInterface.CreateBody(creationSettings);

    this.bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);

    Jolt.destroy(creationSettings);

    return body;
  }

  setMeshPosition(mesh: THREE.Mesh, position: THREE.Vector3, index = 0) {
    if (mesh instanceof THREE.InstancedMesh) {
      const bodies = this.meshMap.get(mesh);

      const body = (bodies as JoltTypes.Body[])[index];

      this.bodyInterface.RemoveBody(body.GetID());
      this.bodyInterface.DestroyBody(body.GetID());

      const physics = mesh.userData.physics;

      let shape = body.GetShape();
      let body2 = this.createBody(
        position,
        new THREE.Quaternion(0, 0, 0, 1),
        physics.mass,
        physics.restitution,
        physics.locked,
        shape
      );

      (bodies as JoltTypes.Body[])[index] = body2;
    } else {
      // TODO: Implement this
    }
  }

  setMeshVelocity(mesh: THREE.Mesh, velocity: THREE.Vector3, index = 0) {
    let body = this.meshMap.get(mesh);
    if (mesh instanceof THREE.InstancedMesh) {
      body = (body as JoltTypes.Body[])[index];
    }
    (body as JoltTypes.Body).SetLinearVelocity(
      new Jolt.Vec3(velocity.x, velocity.y, velocity.z)
    );
  }

  getMeshVelocity(mesh: THREE.Mesh, index = 0): THREE.Vector3 {
    let body = this.meshMap.get(mesh);
    if (mesh instanceof THREE.InstancedMesh) {
      body = (body as JoltTypes.Body[])[index];
    }
    return wrapVec3((body as JoltTypes.Body).GetLinearVelocity());
  }

  //
  step(deltaTime: number) {
    const fixedTimeStep = 1.0 / 60.0;

    this.accumulator += deltaTime;

    // Don't go below 30 Hz to prevent spiral of death
    this.accumulator = Math.min(this.accumulator, 1.0 / 30.0);

    // Step physics with fixed timestep
    while (this.accumulator >= fixedTimeStep) {
      this.jolt.Step(fixedTimeStep, 1);
      this.accumulator -= fixedTimeStep;
    }

    let instancedMeshesToUpdate = new Set<THREE.InstancedMesh>();

    for (let i = 0, l = this.meshes.length; i < l; i++) {
      const mesh = this.meshes[i];

      if (mesh instanceof THREE.InstancedMesh) {
        const array = mesh.instanceMatrix.array;
        const bodies = this.meshMap.get(mesh) as JoltTypes.Body[];

        for (let j = 0; j < bodies.length; j++) {
          const body = bodies[j];

          const position = body.GetPosition();
          const quaternion = body.GetRotation();

          this._position.copy(wrapVec3(position));
          this._quaternion.copy(wrapQuat(quaternion));

          this._matrix
            .compose(this._position, this._quaternion, this._scale)
            .toArray(array, j * 16);
        }

        instancedMeshesToUpdate.add(mesh);
      } else {
        const body = this.meshMap.get(mesh) as JoltTypes.Body;

        const position = body.GetPosition();
        const rotation = body.GetRotation();

        mesh.position.copy(wrapVec3(position));
        mesh.quaternion.copy(wrapQuat(rotation));
      }
    }

    for (let mesh of instancedMeshesToUpdate) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }
}
