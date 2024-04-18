import { IConcreteType, IInstance, Scope } from "../linker/closure";
import { TokenGroup } from "../parser/token";
import { WriterProperty } from "../writer/entity";
import { WriterFile } from "../writer/file";
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
    return undefined;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, Array<WriterProperty>] {
    return this.#components.reduce(
      ([cf, cp], n) => {
        const [f, p] = n.Build(cf, scope);
        return [f, [...cp, p]];
      },
      [file, []] as [WriterFile, Array<WriterProperty>]
    );
  }

  get Keys() {
    return this.#components.map((c) => c.Name);
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
