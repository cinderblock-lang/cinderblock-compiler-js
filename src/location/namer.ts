const name_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const reserved_names: Array<string> = [
  "if",
  "fn",
  "make",
  "struct",
  "namespace",
  "pick",
  "else",
];

export class Namer {
  static #index: number = 0;

  static GetName(): string {
    let name = "";
    let current = this.#index;

    do {
      name += name_chars[current % name_chars.length];
      current = Math.floor(current / name_chars.length);
    } while (current > 0);

    this.#index += 1;

    if (reserved_names.includes(name)) return Namer.GetName();
    return name;
  }

  static Reset() {
    this.#index = -1;
  }
}
