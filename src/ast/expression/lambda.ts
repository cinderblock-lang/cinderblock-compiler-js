import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Namer } from "../../location/namer";
import { Type } from "../type/base";
import { Block } from "../block";
import { ParameterCollection } from "../parameter-collection";

export class LambdaExpression extends Expression {
  readonly #parameters: ParameterCollection;
  readonly #body: Block;
  readonly #returns: Type | undefined;

  readonly #name: string;

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

    this.#name = Namer.GetName();
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
