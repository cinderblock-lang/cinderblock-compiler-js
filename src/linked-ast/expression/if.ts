import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";

export class IfExpression extends LinkedExpression {
  readonly #check: LinkedExpression;
  readonly #if: Block;
  readonly #else: Block;

  constructor(
    ctx: CodeLocation,
    check: LinkedExpression,
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
