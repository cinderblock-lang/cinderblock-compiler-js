import { IsAny } from "../../linker/types";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { Type } from "./base";

export const PrimitiveNames = [
  "int",
  "uint",
  "short",
  "ushort",
  "char",
  "udouble",
  "double",
  "ufloat",
  "float",
  "bool",
  "ulong",
  "long",
  "any",
  "string",
  "null",
] as const;

export type PrimitiveName = (typeof PrimitiveNames)[number];

export function IsPrimitiveName(input: string): input is PrimitiveName {
  return PrimitiveNames.includes(input as any);
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
}
