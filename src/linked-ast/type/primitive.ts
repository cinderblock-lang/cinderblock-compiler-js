import z from "zod";
import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "./base";

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

export class PrimitiveType extends LinkedType {
  readonly #name: PrimitiveName;

  constructor(ctx: CodeLocation, name: PrimitiveName) {
    super(ctx);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  get CName(): string {
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
}
