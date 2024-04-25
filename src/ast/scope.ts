import { LinkedExpression } from "../linked-ast/expression/base";
import { LinkedType } from "../linked-ast/type/base";
import { Namespace } from "./namespace";

export class Scope {
  readonly #namespace: Namespace;
  readonly #types: Record<string, LinkedType>;
  readonly #objects: Record<string, LinkedExpression>;

  constructor(
    namespace: Namespace,
    types: Record<string, LinkedType>,
    objects: Record<string, LinkedExpression>
  ) {
    this.#namespace = namespace;
    this.#types = types;
    this.#objects = objects;
  }

  WithType(name: string, type: LinkedType) {
    return new Scope(
      this.#namespace,
      {
        ...this.#types,
        [name]: type,
      },
      this.#objects
    );
  }

  WithObject(name: string, value: LinkedExpression) {
    return new Scope(this.#namespace, this.#types, {
      ...this.#objects,
      [name]: value,
    });
  }

  GetObject(name: string) {
    return this.#objects[name];
  }

  GetType(name: string) {
    return this.#types[name];
  }
}
