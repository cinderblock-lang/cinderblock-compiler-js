import { Namespace } from "./namespace";

export class Ast {
  readonly #data: Array<Namespace>;

  constructor(...data: Array<Namespace>) {
    this.#data = data;
  }

  with(input: Array<Namespace>) {
    return new Ast(...this.#data.concat(...input));
  }
}
