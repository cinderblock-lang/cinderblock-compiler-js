import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { WriterContext } from "../writer";
import { Expression } from "./base";

export class AccessExpression extends Expression {
  readonly #subject: Component;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Subject() {
    return this.#subject;
  }

  get Target() {
    return this.#target;
  }

  get type_name() {
    return "access_expression";
  }

  c(ctx: WriterContext): string {
    return `${this.Subject.c(ctx)}.${this.Target}`;
  }
}
