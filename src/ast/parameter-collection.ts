import { IClosure } from "../linker/closure";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { Parameter } from "./parameter";

export class ParameterCollection implements IClosure {
  readonly #components: Array<Parameter>;

  constructor(...components: Array<Parameter>) {
    this.#components = components;
  }

  Resolve(name: string): Component | undefined {
    return this.#components.find((c) => c.Name === name);
  }

  static Parse(token_group: TokenGroup): [TokenGroup, ParameterCollection] {
    const result: Array<Parameter> = [];

    while (token_group.Text !== ")") {
      const [t, r] = Parameter.Parse(token_group);
      token_group = t;
      result.push(r);
    }

    return [token_group.Next, new ParameterCollection(...result)];
  }
}
