import { IClosure } from "./closure";

export class Scope {
  readonly #closures: Array<IClosure>;

  constructor(...closures: Array<IClosure>) {
    this.#closures = closures;
  }

  With(closure: IClosure) {
    return new Scope(...this.#closures, closure);
  }

  Resolve(name: string) {
    for (const closure of this.#closures) {
      const result = closure.Resolve(name);
      if (result) return result;
    }
  }
}
