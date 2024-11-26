import * as Colyseus from "colyseus.js";
import type { RoomState } from "../server/src/rooms/schema/RoomState";

export default class Multiplayer {
  public client: Colyseus.Client;

  constructor() {
    this.client = new Colyseus.Client("ws://localhost:2567");
    this.client
      .joinOrCreate<RoomState>("game_room")
      .then((room) => {
        room.onStateChange((state) => {
          console.log(room.name, "has new state:", state);
        });
        room.onMessage("*", (message) => {
          console.log(room.sessionId, "received on", room.name, message);
        });
        room.onError((code, message) => {
          console.log(room.sessionId, "couldn't join", room.name);
        });
        console.log(room.sessionId, "joined", room.name, room.id);
      })
      .catch((e) => {
        console.log("JOIN ERROR", e);
      });
  }
}
