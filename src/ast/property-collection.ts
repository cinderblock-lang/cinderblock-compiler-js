import { IConcreteType, IInstance } from "../linker/closure";
import { TokenGroup } from "../parser/token";
import { StructEntity } from "./entity/struct";
import { Property } from "./property";
import { Type } from "./type/base";

export class PropertyCollection {
  readonly #components: Array<Property>;

  constructor(...components: Array<Property>) {
    this.#components = components;
  }

  ResolveType(name: string, real: StructEntity): IConcreteType | undefined {
    throw new Error("Method not implemented.");
  }

  Resolve(name: string): IInstance | undefined {
    return this.#components.find((c) => c.Name === name);
  }

  static Parse(token_group: TokenGroup): [TokenGroup, PropertyCollection] {
    const result: Array<Property> = [];

    while (token_group.Text !== "}") {
      const [t, r] = Property.Parse(token_group);
      token_group = t;
      result.push(r);
    }

    return [token_group.Next, new PropertyCollection(...result)];
  }
}
