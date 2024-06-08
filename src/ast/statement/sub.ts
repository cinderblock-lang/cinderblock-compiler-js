import { LinkedSubExpression } from "../../linked-ast/expression/sub";
import { LinkedSubStatement } from "../../linked-ast/statement/sub";
import { CodeLocation } from "../../location/code-location";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class SubStatement extends Statement {
  readonly #name: string;
  readonly #equals: Expression;

  constructor(ctx: CodeLocation, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }

  get Name() {
    return this.#name;
  }

  Linked(context: Context) {
    const statement = new LinkedSubStatement(this.CodeLocation, this.#name);
    return context
      .WithObject(
        this.#name,
        new LinkedSubExpression(this.CodeLocation, statement)
      )
      .Build(
        {
          equals: (c) => this.#equals.Linked(c),
        },
        ({ equals }, ctx) => {
          statement.Equals = equals;
          return new ContextResponse(
            ctx.WithObject(
              this.#name,
              new LinkedSubExpression(this.CodeLocation, statement)
            ),
            statement
          );
        }
      );
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Next.Text === "->";
  },
  Extract(token_group, ctx) {
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
        expression: (token_group) => {
          token_group.Expect("->");
          token_group = token_group.Next;
          let result: Expression;
          [token_group, result] = Expression.Parse(token_group, ctx).Destructured;
          return new TokenGroupResponse(token_group.Next, result);
        },
      },
      ({ name, expression }) =>
        new SubStatement(token_group.CodeLocation, name, expression)
    );
  },
});
