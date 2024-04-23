import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { PrimitiveType } from "../type/primitive";

export type LiteralType =
  | "string"
  | "int"
  | "char"
  | "float"
  | "double"
  | "long"
  | "bool"
  | "null";

export class LiteralExpression extends Expression {
  readonly #type: LiteralType;
  readonly #value: string;

  constructor(ctx: CodeLocation, type: LiteralType, value: string) {
    super(ctx);
    this.#type = type;
    this.#value = value;
  }

  get Type(): Type {
    switch (this.#type) {
      case "string":
        return new PrimitiveType(this.CodeLocation, "string");
      case "int":
        return new PrimitiveType(this.CodeLocation, "int");
      case "char":
        return new PrimitiveType(this.CodeLocation, "char");
      case "float":
        return new PrimitiveType(this.CodeLocation, "float");
      case "double":
        return new PrimitiveType(this.CodeLocation, "double");
      case "long":
        return new PrimitiveType(this.CodeLocation, "long");
      case "bool":
        return new PrimitiveType(this.CodeLocation, "bool");
      case "null":
        return new PrimitiveType(this.CodeLocation, "null");
    }
  }
}
