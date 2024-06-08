import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { LinkedInvokationExpression } from "../../linked-ast/expression/invokation";
import { AccessExpression } from "./access";
import { LinkedFunctionType } from "../../linked-ast/type/function";
import { LinkerError } from "../../linker/error";
import { LinkedLambdaExpression } from "../../linked-ast/expression/lambda";
import { LinkedParameterCollection } from "../../linked-ast/parameter-collection";
import { LinkedBlock } from "../../linked-ast/block";
import { LinkedExpression } from "../../linked-ast/expression/base";
import { LinkedReturnStatement } from "../../linked-ast/statement/return";
import { LinkedParameterExpression } from "../../linked-ast/expression/parameter";
import { UninitialisedError } from "../../linker/uninitialised-error";

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

  get Subject() {
    return this.#subject;
  }

  get Parameters() {
    return [...this.#parameters];
  }

  Linked(context: Context): ContextResponse<LinkedExpression> {
    if (
      this.#subject instanceof AccessExpression &&
      !this.#subject.MayAccess(context)
    ) {
      return context.Build(
        {
          params: (context) => {
            const result = context.Map(
              [
                (this.#subject as AccessExpression).Subject,
                ...this.#parameters,
              ],
              (ctx, n) => n.Linked(ctx)
            );

            return new ContextResponse(
              result.Context.PrepareInvokation(result.Response),
              result.Response
            );
          },
          subject: (c) =>
            (this.#subject as AccessExpression).LinkedFunctionTarget(c),
        },
        ({ subject, params }) =>
          new ContextResponse(
            context,
            new LinkedInvokationExpression(this.CodeLocation, subject, params)
          )
      );
    }

    return context.Build(
      {
        params: (context) => {
          const result = context.Map(this.#parameters, (ctx, n) =>
            n.Linked(ctx)
          );

          return new ContextResponse(
            result.Context.PrepareInvokation(result.Response),
            result.Response
          );
        },
        subject: (c) => this.#subject.Linked(c),
      },
      ({ subject, params }): ContextResponse<LinkedExpression> => {
        try {
          const type = subject.Type;
          if (!(type instanceof LinkedFunctionType))
            throw new LinkerError(
              this.CodeLocation,
              "error",
              "May only invoke functions"
            );

          if (type.IsPartial(params))
            return new ContextResponse(
              context,
              new LinkedLambdaExpression(
                this.CodeLocation,
                new LinkedParameterCollection(...type.Remaining(params)),
                new LinkedBlock([
                  new LinkedReturnStatement(
                    this.CodeLocation,
                    new LinkedInvokationExpression(this.CodeLocation, subject, [
                      ...params,
                      ...type
                        .Remaining(params)
                        .map(
                          (p) =>
                            new LinkedParameterExpression(this.CodeLocation, p)
                        ),
                    ])
                  ),
                ]),
                type.Returns
              )
            );
        } catch (err) {
          if (!(err instanceof UninitialisedError)) throw err;
        }

        return new ContextResponse(
          context,
          new LinkedInvokationExpression(this.CodeLocation, subject, params)
        );
      }
    );
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group, prefix) {
    return token_group.Text === "(" && !!prefix;
  },
  Extract(token_group, ctx, prefix) {
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Attempting an invokation without a referenced function"
      );

    return token_group.Build(
      {
        parameters: (token_group) =>
          token_group.Next.Until(
            (token_group) =>
              token_group.Text === ","
                ? Expression.Parse(token_group.Next, ctx, [",", ")"])
                : Expression.Parse(token_group, ctx, [",", ")"]),
            ")"
          ),
      },
      ({ parameters }) =>
        new InvokationExpression(token_group.CodeLocation, prefix, parameters)
    );
  },
});
