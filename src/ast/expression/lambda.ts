import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { LinkedLambdaExpression } from "../../linked-ast/expression/lambda";

export class LambdaExpression extends Expression {
  readonly #parameters: ParameterCollection;
  readonly #body: Block;
  readonly #returns: Type | undefined;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    body: Block,
    returns: Type | undefined
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;
  }

  #get_returns(context: Context) {
    return this.#returns?.Linked(context) ?? this.#body.Returns(context);
  }

  Linked(context: Context) {
    return context.Build(
      {
        params: this.#parameters.Linked,
        body: this.#body.Linked,
        returns: this.#get_returns,
      },
      ({ params, body, returns }) =>
        new ContextResponse(
          context,
          new LinkedLambdaExpression(this.CodeLocation, params, body, returns)
        )
    );
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "fn";
  },
  Extract(token_group, prefix) {
    token_group.Next.Expect("(");
    let parameters: ParameterCollection;
    [token_group, parameters] = ParameterCollection.Parse(
      token_group.Next.Next
    );

    let returns: Type | undefined;
    [token_group, returns] =
      token_group.Text === ":"
        ? Type.Parse(token_group.Next)
        : ([token_group, undefined] as const);

    token_group.Expect("->");

    let body: Block;
    [token_group, body] = Block.Parse(token_group.Next);

    return [
      token_group,
      new LambdaExpression(token_group.CodeLocation, parameters, body, returns),
    ];
  },
});
