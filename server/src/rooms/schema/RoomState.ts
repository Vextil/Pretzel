import { Schema, type, MapSchema } from "@colyseus/schema";

export class Entity extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
}

export class RoomState extends Schema {
  @type("string") mySynchronizedProperty: string = "Hello world";
  @type({ map: Entity }) entities = new MapSchema<Entity>();
}
