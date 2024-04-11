import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class SideStatement extends Statement {
  readonly #value: Component;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "side";
  },
  Extract(token_group) {
    const [after_expression, expression] = Expression.Parse(token_group.Next);

    return [
      after_expression,
      new SideStatement(token_group.CodeLocation, expression),
    ];
  },
});
