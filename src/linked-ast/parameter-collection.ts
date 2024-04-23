import { Parameter } from "./parameter";

export class ParameterCollection {
  readonly #components: Array<Parameter>;

  constructor(...components: Array<Parameter>) {
    this.#components = components;
  }

  get Keys() {
    return this.#components.map((c) => c.Name);
  }

  GetKey(name: string) {
    return this.#components.find((c) => c.Name === name);
  }
}
