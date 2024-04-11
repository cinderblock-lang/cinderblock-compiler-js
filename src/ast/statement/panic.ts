import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class PanicStatement extends Statement {
  readonly #value: Component;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "panic";
  },
  Extract(token_group) {
    const [after_expression, expression] = Expression.Parse(token_group.Next);

    return [
      after_expression,
      new PanicStatement(token_group.CodeLocation, expression),
    ];
  },
});
