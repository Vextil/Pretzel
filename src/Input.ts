export default class Input {
  keyboard: any = {};

  constructor() {
    window.addEventListener("keydown", (event) => {
      this.keyboard[event.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", (event) => {
      this.keyboard[event.key.toLowerCase()] = false;
    });
  }

  public isKeyDown(key: string): boolean {
    return this.keyboard[key] || false;
  }
}
