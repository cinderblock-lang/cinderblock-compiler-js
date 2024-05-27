import { LinkedEntity } from "../../linked-ast/entity/base";
import { LinkedFunctionEntity } from "../../linked-ast/entity/function";
import { CodeLocation } from "../../location/code-location";
import { TokenGroupResponse } from "../../parser/token-group-response";
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

  get Returns() {
    return this.#returns;
  }

  get Content() {
    return this.#content;
  }

  #get_returns(context: Context) {
    return (
      this.#returns?.Linked(context.WithoutInvokation()) ??
      this.#content.Returns(context)
    );
  }

  Linked(context: Context, is_main = false): ContextResponse<LinkedEntity> {
    return context.EnterFunction(this).Build(
      {
        params: (c) => this.#parameters.Linked(c),
        returns: (c) => this.#get_returns(c),
        contents: (c) => this.#content.Linked(c),
      },
      ({ params, returns, contents }) =>
        new ContextResponse(
          context,
          new LinkedFunctionEntity(
            this.CodeLocation,
            is_main,
            params,
            contents,
            returns
          )
        )
    );
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "fn";
  },
  Extract(token_group, options) {
    return token_group.Build(
      {
        name: (token_group) => {
          token_group = token_group.Next;
          return TokenGroupResponse.TextItem(token_group);
        },
        parameters: (token_group) => {
          token_group.Expect("(");
          return ParameterCollection.Parse(token_group.Next);
        },
        returns: (token_group) => {
          if (token_group.Text === ":") {
            return Type.Parse(token_group.Next);
          }

          return new TokenGroupResponse(token_group, undefined);
        },
        body: (token_group) => Block.Parse(token_group),
      },
      ({ name, parameters, body, returns }) =>
        new FunctionEntity(
          token_group.CodeLocation,
          options,
          name,
          parameters,
          body,
          returns
        )
    );
  },
});
