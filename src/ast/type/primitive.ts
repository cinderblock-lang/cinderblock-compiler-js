import z from "zod";
import { IsAny } from "../../linker/types";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { WriterContext } from "../writer";
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

  copy() {
    return new PrimitiveType(this.CodeLocation, this.Name);
  }

  get Name() {
    return this.#name;
  }

  get type_name() {
    return `prim_${this.Name}`;
  }

  c(ctx: WriterContext): string {
    switch (this.Name) {
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

  compatible(target: Component, ctx: WriterContext): boolean {
    if (IsAny(target)) return true;
    if (this.#name === "any") return true;
    return target instanceof PrimitiveType && target.#name === this.#name;
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }

  static #defaulted_string: string;

  default(ctx: WriterContext): string {
    switch (this.Name) {
      case "any":
        return "0";
      case "bool":
        return "0";
      case "char":
        return "0";
      case "float":
        return "-1";
      case "ufloat":
        return "0f";
      case "double":
        return "-1";
      case "udouble":
        return "0";
      case "int":
        return "-1";
      case "uint":
        return "0";
      case "short":
        return "-1";
      case "ushort":
        return "0";
      case "long":
        return "-1";
      case "ulong":
        return "0";
      case "string":
        if (PrimitiveType.#defaulted_string)
          return "&" + PrimitiveType.#defaulted_string;
        const name = Namer.GetName();
        ctx.AddGlobal(`char ${name}[] = {0};`);

        PrimitiveType.#defaulted_string = name;

        return "&" + name;
      case "null":
        return "0";
    }
  }
}
