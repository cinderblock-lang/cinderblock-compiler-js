import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { Type } from "./base";

export const PrimitiveNames = [
  "int",
  "char",
  "double",
  "float",
  "bool",
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
      case "double":
        return "double";
      case "int":
        return "int";
      case "long":
        return "long";
      case "string":
        return "char*";
      case "null":
        return "void*";
    }
  }

  resolve_type(ctx: WriterContext): Component {
    return this;
  }
}
