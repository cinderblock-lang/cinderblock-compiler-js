import { IConcreteType, Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterStringType, WriterType } from "../../writer/type";
import { Type } from "./base";

export class ReferenceType extends Type {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }

  Build(scope: Scope): WriterType {
    const result = scope.ResolveType(this.#name);
    if (!result)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve type"
      );

    return new WriterStringType(result.TypeName);
  }

  ResolveConcrete(scope: Scope): IConcreteType {
    const result = scope.ResolveType(this.#name);
    if (!result)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Unresolved type reference"
      );

    return result;
  }
}

Type.Register({
  Priority: 0,
  Is(token_group) {
    return true;
  },
  Extract(token_group) {
    const name = token_group.Text;
    return [
      token_group.Next,
      new ReferenceType(token_group.CodeLocation, name),
    ];
  },
});
