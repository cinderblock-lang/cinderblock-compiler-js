import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { LinkedLambdaExpression } from "../../linked-ast/expression/lambda";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { LinkerError } from "../../linker/error";

export class LambdaExpression extends Expression {
  readonly #parameters: ParameterCollection;
  readonly #body: Block;
  readonly #returns: Type | undefined;
  readonly #namespace: string;
  readonly #unsafe: boolean;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    body: Block,
    returns: Type | undefined,
    namespace: string,
    unsafe: boolean
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;
    this.#namespace = namespace;
    this.#unsafe = unsafe;
  }

  #get_returns(context: Context) {
    return this.#returns?.Linked(context) ?? this.#body.Returns(context);
  }

  Linked(context: Context) {
    return context.WithLambda(this.#namespace, this.#unsafe).Build(
      {
        params: (c) => this.#parameters.Linked(c),
        body: (c) => this.#body.Linked(c),
        returns: (c) => this.#get_returns(c),
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
  Extract(token_group, ctx) {
    return token_group.Build(
      {
        parameters: (token_group) => {
          token_group = token_group.Next;
          token_group.Expect("(");
          token_group = token_group.Next;
          return ParameterCollection.Parse(token_group);
        },
        returns: (token_group) => {
          if (token_group.Text === ":") return Type.Parse(token_group.Next);

          return new TokenGroupResponse(token_group, undefined);
        },
        body: (token_group) => {
          token_group.Expect("->");
          token_group = token_group.Next;
          return Block.Parse(token_group, ctx);
        },
      },
      ({ parameters, returns, body }) =>
        new LambdaExpression(
          token_group.CodeLocation,
          parameters,
          body,
          returns,
          ctx.Namespace,
          ctx.Unsafe
        )
    );
  },
});
