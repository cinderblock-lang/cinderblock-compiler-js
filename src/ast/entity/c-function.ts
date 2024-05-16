import { LinkedEntity } from "../../linked-ast/entity/base";
import { LinkedCFunction } from "../../linked-ast/entity/c-function";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { PrimitiveName } from "../../parser/types";
import { Block } from "../block";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { ParameterCollection } from "../parameter-collection";
import { PrimitiveType } from "../type/primitive";
import { Entity, EntityOptions } from "./base";
import { FunctionEntity } from "./function";

export class CFunction extends FunctionEntity {
  readonly #includes: Array<string>;
  readonly #parameters: ParameterCollection;
  readonly #content: string;
  readonly #returns: PrimitiveType;

  constructor(
    ctx: CodeLocation,
    options: EntityOptions,
    includes: Array<string>,
    name: string,
    parameters: ParameterCollection,
    content: string,
    returns: PrimitiveType
  ) {
    super(
      ctx,
      { ...options, unsafe: true },
      name,
      parameters,
      new Block(),
      returns
    );

    this.#includes = includes;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  Linked(context: Context): ContextResponse<LinkedEntity> {
    return context.EnterFunction(this).Build(
      {
        params: (c) => this.#parameters.Linked(c),
        returns: (c) => this.#returns.Linked(c.WithoutInvokation()),
      },
      ({ params, returns }) =>
        new ContextResponse(
          context,
          new LinkedCFunction(
            this.CodeLocation,
            this.#includes,
            this.Name,
            params,
            this.#content,
            returns
          )
        )
    );
  }
}

Entity.Register({
  Is(token_group) {
    return token_group.Text === "cfn";
  },
  Extract(token_group, options) {
    return token_group.Build(
      {
        includes: (token_group) => {
          token_group = token_group.Next;
          token_group.Expect("[");
          token_group = token_group.Next;
          return token_group.Until((token_group) => {
            const candidate = token_group.Text;
            if (candidate.startsWith('"<'))
              return new TokenGroupResponse(
                token_group.Next,
                candidate.substring(1, candidate.length - 1)
              );
            return new TokenGroupResponse(token_group.Next, candidate);
          }, "]");
        },
        name: (token_group) => {
          return new TokenGroupResponse(token_group.Next, token_group.Text);
        },
        parameters: (token_group) => {
          token_group.Expect("(");
          token_group = token_group.Next;
          return ParameterCollection.Parse(token_group);
        },
        returns: (token_group) => {
          token_group.Expect(":");
          token_group = token_group.Next;

          return new TokenGroupResponse(
            token_group.Next,
            new PrimitiveType(
              token_group.CodeLocation,
              PrimitiveName.parse(token_group.Text)
            )
          );
        },
        body: (token_group) => {
          let body: string = token_group.Text;
          if (!body.startsWith("`") || !body.endsWith("`"))
            throw new ParserError(
              token_group.CodeLocation,
              "Expected a back-tick string"
            );

          return new TokenGroupResponse(token_group.Next, body);
        },
      },
      ({ includes, name, parameters, body, returns }) =>
        new CFunction(
          token_group.CodeLocation,
          options,
          includes,
          name,
          parameters,
          body.substring(1, body.length - 1),
          returns
        )
    );
  },
});
