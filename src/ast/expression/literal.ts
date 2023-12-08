import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { WriterContext } from "../writer";
import { Component } from "../component";
import { PrimitiveType } from "../type/primitive";
import { Namer } from "../../location/namer";

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
        const name = Namer.GetName();
        ctx.AddGlobal(
          `char ${name}[] = {${new TextEncoder()
            .encode(eval(`"${this.Value}"`))
            .reduce((c, n) => [...c, n.toString()], [] as Array<string>)
            .concat(["0"])
            .join(",")}};`
        );

        return '&' + name;
    }
  }

  resolve_type(ctx: WriterContext): Component {
    return new PrimitiveType(
      this.CodeLocation,
      this.Type === "char"
        ? "char"
        : this.Type === "double"
        ? "double"
        : this.Type === "float"
        ? "float"
        : this.Type === "int"
        ? "int"
        : this.Type === "long"
        ? "long"
        : this.Type === "bool"
        ? "bool"
        : this.Type === "string"
        ? "string"
        : "any"
    );
  }
}
