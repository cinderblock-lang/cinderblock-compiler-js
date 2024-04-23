import { Property } from "./property";

export class PropertyCollection {
  readonly #components: Array<Property>;

  constructor(...components: Array<Property>) {
    this.#components = components;
  }

  get Keys() {
    return this.#components.map((c) => c.Name);
  }

  GetKey(name: string) {
    return this.#components.find((c) => c.Name === name);
  }
}
