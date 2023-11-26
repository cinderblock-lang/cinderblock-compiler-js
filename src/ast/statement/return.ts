import { CodeLocation } from "../../location/code-location";
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
    const type = this.Value.resolve_type(ctx);
    const expression = this.Value.c(ctx);
    ctx.AddPrefix(`${type.c(ctx)} result = ${expression};`);

    return `result`;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Value.resolve_type(ctx);
  }
}
