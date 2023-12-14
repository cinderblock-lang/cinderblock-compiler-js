import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { PrimitiveType } from "../type/primitive";
import { WriterContext } from "../writer";
import { Statement } from "./base";
import { IgnoreCallstack } from "./common";

export class ReturnStatement extends Statement {
  readonly #value: Component;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  get Value() {
    return this.#value;
  }

  get type_name() {
    return "return_statement";
  }

  c(ctx: WriterContext): string {
    const result_name = Namer.GetName();
    const type = this.Value.resolve_type(ctx);
    const expression = this.Value.c(ctx);
    ctx.AddPrefix(
      `${type.c(ctx)} ${result_name} = ${expression};`,
      result_name,
      [expression]
    );

    if (IgnoreCallstack.includes(ctx.BodyName)) return result_name;

    if (type instanceof PrimitiveType) {
      ctx.AddPrefix(`_Cleanup(current_scope);`, "cleanup", [result_name]);
      return result_name;
    }

    return `_Return(current_scope, ${result_name})`;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Value.resolve_type(ctx);
  }
}
