import { LinkedSideStatement } from "../../linked-ast/statement/side";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class SideStatement extends Statement {
  readonly #value: Expression;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  Linked(context: Context) {
    return context.Build(
      {
        value: (c) => this.#value.Linked(c),
      },
      ({ value }) => new LinkedSideStatement(this.CodeLocation, value)
    );
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "side";
  },
  Extract(token_group) {
    return token_group.Build(
      {
        expression: (token_group) => {
          token_group = token_group.Next;
          return Expression.Parse(token_group);
        },
      },
      ({ expression }) =>
        new SideStatement(token_group.CodeLocation, expression)
    );
  },
});
