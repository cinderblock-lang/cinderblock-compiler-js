import { IConcreteType, IInstance, Scope } from "../linker/closure";
import { TokenGroup } from "../parser/token";
import { WriterProperty } from "../writer/entity";
import { StructEntity } from "./entity/struct";
import { Property } from "./property";

export class PropertyCollection {
  readonly #components: Array<Property>;

  constructor(...components: Array<Property>) {
    this.#components = components;
  }

  Resolve(name: string) {
    return this.#components.find((c) => c.Name === name);
  }

  ResolveType(name: string, real: StructEntity): IConcreteType | undefined {
    throw new Error("Method not implemented.");
  }

  Build(scope: Scope): Array<WriterProperty> {
    return this.#components.map((c) => c.Build(scope));
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
