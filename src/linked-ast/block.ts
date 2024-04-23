import { Statement } from "./statement/base";
import { Type } from "./type/base";

export class Block {
  readonly #components: Array<Statement>;
  readonly #returns: Type;

  constructor(components: Array<Statement>, returns: Type) {
    this.#components = components;
    this.#returns = returns;
  }

  get Returns() {
    return this.#returns;
  }
}
