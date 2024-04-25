import { LinkedProperty } from "../linked-ast/property";
import { LinkedPropertyCollection } from "../linked-ast/property-collection";
import { TokenGroup } from "../parser/token";
import { CallStack } from "./callstack";
import { Property } from "./property";
import { Scope } from "./scope";

export class PropertyCollection {
  readonly #components: Array<Property>;

  constructor(...components: Array<Property>) {
    this.#components = components;
  }

  Resolve(name: string) {
    return this.#components.find((c) => c.Name === name);
  }

  get Keys() {
    return this.#components.map((c) => c.Name);
  }

  Linked(
    scope: Scope,
    callstack: CallStack
  ): [Scope, LinkedPropertyCollection] {
    let result: Array<LinkedProperty>;

    [scope, result] = this.#components.reduce(
      ([scope, map], n, i) => {
        let result: LinkedProperty;
        [scope, result] = n.Linked(scope, callstack.WithParameterIndex(i));

        return [scope, [...map, result]];
      },
      [scope, []] as [Scope, Array<LinkedProperty>]
    );

    return [scope, new LinkedPropertyCollection(...result)];
  }

  static Parse(token_group: TokenGroup): [TokenGroup, PropertyCollection] {
    const result: Array<Property> = [];

    while (token_group.Text !== "}") {
      const [t, r] = Property.Parse(token_group);
      token_group = t.Next;
      result.push(r);
    }

    return [token_group.Next, new PropertyCollection(...result)];
  }
}
