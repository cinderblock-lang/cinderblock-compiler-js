import { LinkedReturnStatement } from "../../linked-ast/statement/return";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class ReturnStatement extends Statement {
  readonly #value: Expression;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  ReturnType(context: Context) {
    const result = this.#value.Linked(context);
    return new ContextResponse(result.Context, result.Response.Type);
  }

  Linked(context: Context) {
    return context.Build(
      {
        value: (c) => this.#value.Linked(c),
      },
      ({ value }) => new LinkedReturnStatement(this.CodeLocation, value)
    );
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "return";
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
        new ReturnStatement(token_group.CodeLocation, expression)
    );
  },
});
