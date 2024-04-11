import { Component } from "./component";
import { ComponentGroup } from "./component-group";

export class Ast {
  readonly #data: Array<Component>;

  constructor(...data: Array<ComponentGroup>) {
    this.#data = data.flatMap((d) => [...d.iterator()]);
  }

  *iterator() {
    for (const item of this.#data) yield item;
  }

  with(input: ComponentGroup) {
    return new Ast(new ComponentGroup(...this.#data), input);
  }
}
