export default class Input {
  keyboard: any = {};

  constructor() {
    window.addEventListener("keydown", (event) => {
        console.log(event.key);
      this.keyboard[event.key] = true;
    });
    window.addEventListener("keyup", (event) => {
      this.keyboard[event.key] = false;
    });
  }

  public isKeyDown(key: string): boolean {
    return this.keyboard[key] || false;
  }
}
