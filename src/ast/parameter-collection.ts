import { TokenGroup } from "../parser/token";
import { Parameter } from "./parameter";

export class ParameterCollection {
  readonly #components: Array<Parameter>;

  constructor(...components: Array<Parameter>) {
    this.#components = components;
  }

  static Parse(token_group: TokenGroup): [TokenGroup, ParameterCollection] {
    const result: Array<Parameter> = [];
    if (token_group.Text === ")")
      return [token_group.Next, new ParameterCollection()];

    while (token_group.Previous.Text !== ")") {
      const [t, r] = Parameter.Parse(token_group);
      token_group = t;
      result.push(r);
    }

    return [token_group, new ParameterCollection(...result)];
  }
}
