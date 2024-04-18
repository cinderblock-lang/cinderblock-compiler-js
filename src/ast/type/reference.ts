import { IConcreteType, Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFile } from "../../writer/file";
import {
  WriterPrimitiveType,
  WriterStructType,
  WriterType,
} from "../../writer/type";
import { Entity } from "../entity/base";
import { Type } from "./base";
import { PrimitiveType } from "./primitive";

export class ReferenceType extends Type {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterType] {
    const [result] = scope.ResolveType(this.#name);
    if (!result)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve type"
      );

    if (result instanceof Entity) [file] = result.Declare(file, scope);

    if (result instanceof PrimitiveType)
      return [file, new WriterPrimitiveType(result.TypeName)];
    return [file, new WriterStructType(result.TypeName)];
  }

  ResolveConcrete(scope: Scope): IConcreteType {
    const [result] = scope.ResolveType(this.#name);
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
