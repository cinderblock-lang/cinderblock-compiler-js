import z from "zod";
import { CodeLocation } from "../../location/code-location";
import { Type } from "./base";

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

export class PrimitiveType extends Type {
  readonly #name: PrimitiveName;

  constructor(ctx: CodeLocation, name: PrimitiveName) {
    super(ctx);
    this.#name = name;
  }
}
