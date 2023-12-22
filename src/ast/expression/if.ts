import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { ReturnStatement } from "../statement/return";
import { Namer } from "../../location/namer";
import { SideStatement } from "../statement/side";
import { RequireType } from "../../location/require-type";
import { IsExpression } from "./is";
import { LinkerError } from "../../linker/error";

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

  #render_is(ctx: WriterContext) {
    const check = this.#check;
    RequireType(IsExpression, check);
    const type = this.If.resolve_block_type(ctx, "if");

    if (check.IsMatch(ctx)) {
      const if_context = ctx.WithBody(this.If, "if");
      const if_return = this.If.find(ReturnStatement).c(if_context);

      for (const side of this.If.find_all(SideStatement)) {
        side.c(if_context);
      }
      const name = Namer.GetName();
      ctx.AddPrefix(`${type.c(ctx)} ${name};`, name, []);

      ctx.AddPrefix(
        `{
        ${if_context.Prefix}
        ${name} = ${if_return};
        ${if_context.Suffix}
      } `,
        name,
        []
      );

      return name;
    } else {
      const else_context = ctx.WithBody(this.Else, "else");
      const else_return = this.Else.find(ReturnStatement).c(else_context);

      for (const side of this.Else.find_all(SideStatement)) {
        side.c(else_context);
      }
      const name = Namer.GetName();
      ctx.AddPrefix(`${type.c(ctx)} ${name};`, name, []);

      ctx.AddPrefix(
        `{
        ${else_context.Prefix}
        ${name} = ${else_return};
        ${else_context.Suffix}
      }`,
        name,
        []
      );

      return name;
    }
  }

  c(ctx: WriterContext): string {
    if (this.Check instanceof IsExpression) return this.#render_is(ctx);
    const type = this.If.resolve_block_type(ctx, "if");
    const check = this.Check.c(ctx);
    const if_context = ctx.WithBody(this.If, "if");
    const if_return = this.If.find(ReturnStatement).c(if_context);

    for (const side of this.If.find_all(SideStatement)) {
      side.c(if_context);
    }

    const else_context = ctx.WithBody(this.Else, "else");
    const else_return = this.Else.find(ReturnStatement).c(else_context);

    for (const side of this.Else.find_all(SideStatement)) {
      side.c(else_context);
    }
    const name = Namer.GetName();
    ctx.AddPrefix(`${type.c(ctx)} ${name};`, name, []);

    ctx.AddPrefix(
      `if (${check}) {
      ${if_context.Prefix}
      ${name} = ${if_return};
      ${if_context.Suffix}
    } else {
      ${else_context.Prefix}
      ${name} = ${else_return};
      ${else_context.Suffix}
    }`,
      name,
      [check]
    );

    return name;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    return this.If.resolve_block_type(ctx, "if");
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
