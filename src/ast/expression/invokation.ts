import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Context } from "../context";
import { LinkedExpression } from "../../linked-ast/expression/base";
import { ContextResponse } from "../context-response";
import { LinkedInvokationExpression } from "../../linked-ast/expression/invokation";

export class InvokationExpression extends Expression {
  readonly #subject: Expression;
  readonly #parameters: Array<Expression>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    parameters: Array<Expression>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }

  Linked(context: Context) {
    return context.Build(
      {
        subject: this.#subject.Linked,
        params: (context) =>
          this.#parameters.reduce((ctx, n, i) => {
            const result = n.Linked(ctx.Context);

            return new ContextResponse(result.Context, [
              ...ctx.Response,
              result.Response,
            ]);
          }, new ContextResponse(context, [] as Array<LinkedExpression>)),
      },
      ({ subject, params }, ctx) =>
        new ContextResponse(
          ctx.PrepareInvokation(params),
          new LinkedInvokationExpression(this.CodeLocation, subject, params)
        )
    );
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group, prefix) {
    return token_group.Text === "(" && !!prefix;
  },
  Extract(token_group, prefix) {
    const start = token_group.CodeLocation;
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Attempting an invokation without a referenced function"
      );

    token_group = token_group.Next;
    let parameters: Array<Expression> = [];
    while (token_group.Text !== ")") {
      let result: Expression;
      [token_group, result] = Expression.Parse(token_group, [",", ")"]);
      parameters = [...parameters, result];
    }

    token_group = token_group.Next;

    return [token_group, new InvokationExpression(start, prefix, parameters)];
  },
});
