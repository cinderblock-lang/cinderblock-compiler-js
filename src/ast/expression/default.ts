import { LinkedDefaultExpression } from "../../linked-ast/expression/default";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { Type } from "../type/base";
import { Expression } from "./base";

export class DefaultExpression extends Expression {
  readonly #subject: Type;

  constructor(ctx: CodeLocation, subject: Type) {
    super(ctx);
    this.#subject = subject;
  }

  Linked(context: Context) {
    return context.Build(
      {
        subject: (c) => this.#subject.Linked(c),
      },
      ({ subject }) => new LinkedDefaultExpression(this.CodeLocation, subject)
    );
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "default";
  },
  Extract(token_group, prefix) {
    return token_group.Build(
      {
        subject: (token_group) => {
          token_group = token_group.Next;
          token_group.Expect("(");
          token_group = token_group.Next;
          const result = Type.Parse(token_group);
          token_group = result.Context;
          token_group.Expect(")");
          return new TokenGroupResponse(token_group.Next, result.Response);
        },
      },
      ({ subject }) => new DefaultExpression(token_group.CodeLocation, subject)
    );
  },
});
