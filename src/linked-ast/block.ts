import { LinkedStatement } from "./statement/base";
import { LinkedType } from "./type/base";

export class Block {
  readonly #components: Array<LinkedStatement>;
  readonly #returns: LinkedType;

  constructor(components: Array<LinkedStatement>, returns: LinkedType) {
    this.#components = components;
    this.#returns = returns;
  }

  get Returns() {
    return this.#returns;
  }
}
