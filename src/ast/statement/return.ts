import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { WriterContext } from "../writer";
import { Statement } from "./base";

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
    ctx.AddPrefix(`${type.c(ctx)} ${result_name} = ${expression};`, "return", [
      expression,
    ]);

    return result_name;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.Value.compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Value.resolve_type(ctx);
  }
}
