import { Unique } from "../utils";
import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { StoreStatement } from "../statement/store";
import { RawStatement } from "../statement/raw";
import { ReturnStatement } from "../statement/return";
import { ResolveBlockType } from "../../linker/resolve";
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
    const type = ResolveBlockType(this.If, ctx);
    const name = Namer.GetName();
    ctx.prefix.push(`${type.c(ctx)} ${name};`);
    const if_prefix: Array<string> = [];
    const if_suffix: Array<string> = [];

    let if_locals: Record<string, Component> = {};
    for (const statement of this.If.iterator()) {
      if (statement instanceof StoreStatement) {
        if_locals[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        if_locals[statement.Reference] = statement;
      }
    }

    const if_return = this.If.find(ReturnStatement).c({
      ...ctx,
      prefix: if_prefix,
      suffix: if_suffix,
      locals: if_locals,
    });

    const else_prefix: Array<string> = [];
    const else_suffix: Array<string> = [];

    let else_locals: Record<string, Component> = {};
    for (const statement of this.Else.iterator()) {
      if (statement instanceof StoreStatement) {
        else_locals[statement.Name] = statement;
      }

      if (statement instanceof RawStatement) {
        else_locals[statement.Reference] = statement;
      }
    }

    const else_return = this.Else.find(ReturnStatement).c({
      ...ctx,
      prefix: else_prefix,
      suffix: else_suffix,
      locals: else_locals,
    });

    ctx.prefix.push(`if (${this.Check.c(ctx)}) {
      ${if_prefix.filter(Unique).join("\n")}
      ${name} = ${if_return};
      ${if_suffix.filter(Unique).join("\n")}
    } else {
      ${else_prefix.filter(Unique).join("\n")}
      ${name} = ${else_return};
      ${else_suffix.filter(Unique).join("\n")}
    }`);

    return name;
  }
}
