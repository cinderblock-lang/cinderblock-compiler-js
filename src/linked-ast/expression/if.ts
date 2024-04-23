import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";

export class IfExpression extends Expression {
  readonly #check: Expression;
  readonly #if: Block;
  readonly #else: Block;

  constructor(
    ctx: CodeLocation,
    check: Expression,
    on_if: Block,
    on_else: Block
  ) {
    super(ctx);
    this.#check = check;
    this.#if = on_if;
    this.#else = on_else;
  }

  get Type() {
    return this.#if.Returns;
  }
}
