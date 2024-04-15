import z from "zod";
import { CodeLocation } from "../../location/code-location";
import { Type } from "./base";
import { ParserError } from "../../parser/error";
import { IConcreteType, Scope } from "../../linker/closure";
import { WriterPrimitiveType, WriterType } from "../../writer/type";
import { WriterFile } from "../../writer/file";

export const PrimitiveName = z.union([
  z.literal("int"),
  z.literal("uint"),
  z.literal("short"),
  z.literal("ushort"),
  z.literal("char"),
  z.literal("udouble"),
  z.literal("double"),
  z.literal("ufloat"),
  z.literal("float"),
  z.literal("bool"),
  z.literal("ulong"),
  z.literal("long"),
  z.literal("any"),
  z.literal("string"),
  z.literal("null"),
]);

export type PrimitiveName = z.infer<typeof PrimitiveName>;

export function IsPrimitiveName(input: string): input is PrimitiveName {
  const result = PrimitiveName.safeParse(input);

  return result.success;
}

export class PrimitiveType extends Type implements IConcreteType {
  readonly #name: PrimitiveName;

  constructor(ctx: CodeLocation, name: PrimitiveName) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  get TypeName(): string {
    switch (this.#name) {
      case "any":
        return "void*";
      case "bool":
        return "_Bool";
      case "char":
        return "char";
      case "float":
        return "float";
      case "ufloat":
        return "unsigned float";
      case "double":
        return "double";
      case "udouble":
        return "unsigned double";
      case "int":
        return "int";
      case "uint":
        return "unsigned int";
      case "short":
        return "short";
      case "ushort":
        return "unsigned short";
      case "long":
        return "long";
      case "ulong":
        return "unsigned long";
      case "string":
        return "char*";
      case "null":
        return "void*";
    }
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterType] {
    return [file, new WriterPrimitiveType(this.TypeName)];
  }

  ResolveConcrete(scope: Scope): IConcreteType {
    return this;
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return IsPrimitiveName(token_group.Text);
  },
  Extract(token_group) {
    const name = token_group.Text;

    if (!IsPrimitiveName(name))
      throw new ParserError(token_group.CodeLocation, "Invalid primitive name");

    return [
      token_group.Next,
      new PrimitiveType(token_group.CodeLocation, name),
    ];
  },
});
