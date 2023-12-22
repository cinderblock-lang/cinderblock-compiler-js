import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { Expression } from "./base";

export class DefaultExpression extends Expression {
  readonly #subject: Component;

  constructor(ctx: CodeLocation, subject: Component) {
    super(ctx);
    this.#subject = subject;
  }

  get Subject() {
    return this.#subject;
  }

  get type_name() {
    return "default_expression";
  }

  c(ctx: WriterContext): string {
    return this.#subject.default(ctx);
  }

  compatible(target: Component, ctx: WriterContext): boolean {
    return this.resolve_type(ctx).compatible(target, ctx);
  }

  resolve_type(ctx: WriterContext): Component {
    return this.#subject.resolve_type(ctx);
  }

  default(ctx: WriterContext): string {
    throw new LinkerError(this.CodeLocation, "May not have a default");
  }
}
