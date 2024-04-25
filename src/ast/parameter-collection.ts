import { LinkedParameter } from "../linked-ast/parameter";
import { LinkedParameterCollection } from "../linked-ast/parameter-collection";
import { TokenGroup } from "../parser/token";
import { CallStack } from "./callstack";
import { Parameter } from "./parameter";
import { Scope } from "./scope";

export class ParameterCollection {
  readonly #components: Array<Parameter>;

  constructor(...components: Array<Parameter>) {
    this.#components = components;
  }

  Linked(
    scope: Scope,
    callstack: CallStack
  ): [Scope, LinkedParameterCollection] {
    let result: Array<LinkedParameter>;

    [scope, result] = this.#components.reduce(
      ([scope, map], n, i) => {
        let result: LinkedParameter;
        [scope, result] = n.Linked(scope, callstack.WithParameterIndex(i));

        return [scope, [...map, result]];
      },
      [scope, []] as [Scope, Array<LinkedParameter>]
    );

    return [scope, new LinkedParameterCollection(...result)];
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
