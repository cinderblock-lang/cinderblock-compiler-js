import { Expression } from "./base";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { LinkerError } from "../../linker/error";

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
    const expression = this.Expression.c(ctx);
    const type = this.Expression.resolve_type(ctx);

    ctx.AddPrefix(`${type.c(ctx)} ${name} = ${expression};`, name, [
      expression,
    ]);

    return name;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    return this.Expression.resolve_type(ctx);
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
