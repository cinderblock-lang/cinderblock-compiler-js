import { Expression } from "./base";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";

export class BracketsExpression extends Expression {
  readonly #expression: Component;

  constructor(ctx: CodeLocation, expression: Expression) {
    super(ctx);
    this.#expression = expression;
  }

  get Expression() {
    return this.#expression;
  }

  get type_name() {
    return "brackets_expression";
  }

  c(ctx: WriterContext): string {
    const name = Namer.GetName();
    const type = this.Expression.resolve_type(ctx);

    ctx.AddPrefix(`${type.c(ctx)} ${name} = ${this.Expression.c(ctx)};`, name);

    return name;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Expression.resolve_type(ctx);
  }
}
