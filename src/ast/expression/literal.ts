import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { WriterContext } from "../writer";

export type LiteralType =
  | "string"
  | "int"
  | "char"
  | "float"
  | "double"
  | "long"
  | "bool";

export class LiteralExpression extends Expression {
  readonly #type: LiteralType;
  readonly #value: string;

  constructor(ctx: CodeLocation, type: LiteralType, value: string) {
    super(ctx);
    this.#type = type;
    this.#value = value;
  }

  copy() {
    return new LiteralExpression(this.CodeLocation, this.#type, this.#value);
  }

  get Type() {
    return this.#type;
  }

  get Value() {
    return this.#value;
  }

  get type_name() {
    return "literal_expression";
  }

  c(ctx: WriterContext): string {
    switch (this.Type) {
      case "bool":
        return this.Value === "true" ? "1" : "0";
      case "char":
        return `'${this.Value}'`;
      case "double":
        return this.Value.replace("d", "");
      case "float":
        return this.Value;
      case "int":
        return this.Value.replace("i", "");
      case "long":
        return this.Value;
      case "string":
        return `"${this.Value}"`;
    }
  }
}
