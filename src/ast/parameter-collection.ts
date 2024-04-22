import {
  IConcreteType,
  IDiscoverableType,
  IInstance,
  IsConcreteType,
  Scope,
} from "../linker/closure";
import { TokenGroup } from "../parser/token";
import { WriterProperty } from "../writer/entity";
import { WriterFile } from "../writer/file";
import { StructEntity } from "./entity/struct";
import { Parameter } from "./parameter";
import { Type } from "./type/base";
import { FunctionType } from "./type/function";
import { SchemaType } from "./type/schema";
import { UseType } from "./type/use";

export class ParameterCollection {
  readonly #components: Array<Parameter>;

  constructor(...components: Array<Parameter>) {
    this.#components = components;
  }

  Build(
    file: WriterFile,
    scope: Scope,
    use_cinderblock_name = false
  ): [WriterFile, Array<WriterProperty>] {
    return this.#components.reduce(
      ([cf, cr], n): [WriterFile, Array<WriterProperty>] => {
        const [f, r] = n.Build(cf, scope, use_cinderblock_name);
        return [f, [...cr, r]];
      },
      [file, []] as [WriterFile, Array<WriterProperty>]
    );
  }

  ResolveType(
    name: string,
    parameters: Array<IConcreteType>
  ): IConcreteType | undefined {
    const resolve = (
      input: Type | undefined,
      match: IConcreteType
    ): IConcreteType | undefined => {
      if (!input) return undefined;

      if (input instanceof UseType && input.Name === name) {
        return match;
      }

      if (input instanceof SchemaType && match instanceof StructEntity) {
        return input.Properties.ResolveType(name, match);
      }

      if (input instanceof FunctionType && match instanceof FunctionType) {
        if (!IsConcreteType(match.Returns)) return undefined;
        return (
          input.Parameters.ResolveType(
            name,
            match.Parameters.AsConcreteTypes
          ) || resolve(input.Returns, match.Returns)
        );
      }
    };

    return this.#components
      .map((p, i) => resolve(p.Type, parameters[i]))
      .find((p) => !!p);
  }

  DiscoverType(name: string) {
    const resolve = (
      input: Type | undefined
    ): IDiscoverableType | undefined => {
      if (!input) return undefined;

      if (input instanceof UseType && input.Name === name) return input;

      if (input instanceof SchemaType)
        return input.Properties.DiscoverType(name);

      if (input instanceof FunctionType)
        return input.Parameters.DiscoverType(name);
    };

    return this.#components.map((p, i) => resolve(p.Type)).find((p) => !!p);
  }

  Resolve(name: string): IInstance | undefined {
    return this.#components.find((c) => c.Name === name);
  }

  get AsConcreteTypes() {
    return this.#components
      .map((c) => c.Type)
      .filter(IsConcreteType) as any as Array<IConcreteType>;
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
