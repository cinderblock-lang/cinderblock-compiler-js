import { IClosure, IConcreteType, IInstance } from "../linker/closure";
import { TokenGroup } from "../parser/token";
import { Parameter } from "./parameter";
import { Type } from "./type/base";

export class ParameterCollection implements IClosure {
  readonly #components: Array<Parameter>;

  constructor(...components: Array<Parameter>) {
    this.#components = components;
  }

  ResolveType(type: Type): IConcreteType | undefined {
    throw new Error("Method not implemented.");
  }

  Resolve(name: string): IInstance | undefined {
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
