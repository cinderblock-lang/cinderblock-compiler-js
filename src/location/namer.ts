const name_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export class Namer {
  static #index: number = 0;

  static GetName() {
    let name = "";
    let current = this.#index;

    do {
      name += name_chars[current % name_chars.length];
      current = Math.floor(current / name_chars.length);
    } while (current > 0);

    this.#index += 1;
    return name;
  }

  static Reset() {
    this.#index = -1;
  }
}
