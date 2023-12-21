import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { WriterContext } from "../writer";
import { FunctionParameter } from "../function-parameter";
import { LinkerError } from "../../linker/error";
import { Component } from "../component";

export class ReferenceExpression extends Expression {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }
  get Name() {
    return this.#name;
  }

  get type_name() {
    return "reference_expression";
  }

  c(ctx: WriterContext): string {
    const target = ctx.FindReference(this.Name);
    if (!target.length)
      throw new LinkerError(this.CodeLocation, "Could not find reference");
    if (target[0] instanceof FunctionParameter) return this.Name;
    return `(${target[0].c(ctx)})`;
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    const target = ctx.FindReference(this.Name);
    if (!target.length)
      throw new LinkerError(this.CodeLocation, "Unresolved reference");

    return target[0].resolve_type(ctx);
  }
}
