import { Unique } from "../utils";
import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { StoreStatement } from "../statement/store";
import { RawStatement } from "../statement/raw";
import { ReturnStatement } from "../statement/return";
import { Namer } from "../../location/namer";

export class IfExpression extends Expression {
  readonly #check: Component;
  readonly #if: ComponentGroup;
  readonly #else: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    check: Expression,
    on_if: ComponentGroup,
    on_else: ComponentGroup
  ) {
    super(ctx);
    this.#check = check;
    this.#if = on_if;
    this.#else = on_else;
  }

  get Check() {
    return this.#check;
  }

  get If() {
    return this.#if;
  }

  get Else() {
    return this.#else;
  }

  get type_name() {
    return "if_expression";
  }

  c(ctx: WriterContext): string {
    const type = this.If.resolve_block_type(ctx, "if");
    const name = Namer.GetName();
    ctx.AddPrefix(`${type.c(ctx)} ${name};`, name);
    const if_context = ctx.WithBody(this.If, "if");

    const if_return = this.If.find(ReturnStatement).c(if_context);

    const else_context = ctx.WithBody(this.Else, "else");
    const else_return = this.Else.find(ReturnStatement).c(else_context);

    ctx.AddPrefix(
      `if (${this.Check.c(ctx)}) {
      ${if_context.Prefix}
      ${name} = ${if_return};
      ${if_context.Suffix}
    } else {
      ${else_context.Prefix}
      ${name} = ${else_return};
      ${else_context.Suffix}
    }`,
      name
    );

    return name;
  }

  resolve_type(ctx: WriterContext): Component {
    return this.If.resolve_block_type(ctx, "if");
  }
}
