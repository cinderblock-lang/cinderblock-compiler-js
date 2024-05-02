import { LinkedEntity } from "../../linked-ast/entity/base";
import { LinkedFunctionEntity } from "../../linked-ast/entity/function";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { ParameterCollection } from "../parameter-collection";
import { Type } from "../type/base";
import { Entity, EntityOptions } from "./base";

export class FunctionEntity extends Entity {
  readonly #name: string;
  readonly #parameters: ParameterCollection;
  readonly #content: Block;
  readonly #returns: Type | undefined;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    name: string,
    parameters: ParameterCollection,
    content: Block,
    returns: Type | undefined
  ) {
    super(ctx, options);
    this.#name = name;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  get Parameters() {
    return this.#parameters;
  }

  get Name() {
    return this.#name;
  }

  #get_returns(context: Context) {
    return this.#returns?.Linked(context) ?? this.#content.Returns(context);
  }

  Linked(context: Context): ContextResponse<LinkedEntity> {
    return context.EnterFunction(this).Build(
      {
        params: this.#parameters.Linked,
        returns: this.#get_returns,
        contents: this.#content.Linked,
      },
      ({ params, returns, contents }) =>
        new LinkedFunctionEntity(
          this.CodeLocation,
          this.#name,
          params,
          contents,
          returns
        )
    );
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "fn";
  },
  Extract(token_group, options) {
    const name = token_group.Next.Text;
    token_group = token_group.Skip(2);

    token_group.Expect("(");
    token_group = token_group.Next;

    let parameters: ParameterCollection;
    [token_group, parameters] = ParameterCollection.Parse(token_group);

    let returns: undefined | Type = undefined;
    if (token_group.Text === ":") {
      [token_group, returns] = Type.Parse(token_group.Next);
    }

    let body: Block;
    [token_group, body] = Block.Parse(token_group);

    return [
      token_group,
      new FunctionEntity(
        token_group.CodeLocation,
        options,
        name,
        parameters,
        body,
        returns
      ),
    ];
  },
});
