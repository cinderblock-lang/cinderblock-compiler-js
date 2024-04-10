import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Expression } from "./base";

export class AccessExpression extends Expression {
  readonly #subject: Component;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }
}
