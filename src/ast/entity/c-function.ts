import { LinkedEntity } from "../../linked-ast/entity/base";
import { LinkedCFunction } from "../../linked-ast/entity/c-function";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
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
        returns: (c) => this.#returns.Linked(c),
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
    token_group = token_group.Next;
    token_group.Expect("[");

    let includes: Array<string> = [];
    if (token_group.Next.Text !== "]") {
      while (token_group.Text !== "]") {
        token_group = token_group.Next;
        const candidate = token_group.Text;
        if (candidate.startsWith('"<'))
          includes = [
            ...includes,
            candidate.substring(1, candidate.length - 1),
          ];
        else includes = [...includes, candidate];
        token_group = token_group.Next;
      }
    } else {
      token_group = token_group.Next;
    }

    token_group = token_group.Next;
    const name = token_group.Text;
    token_group = token_group.Next;

    token_group.Expect("(");
    token_group = token_group.Next;

    let parameters: ParameterCollection;
    [token_group, parameters] = ParameterCollection.Parse(token_group);

    token_group.Expect(":");
    token_group = token_group.Next;
    const type_name = token_group.Text;

    const returns = new PrimitiveType(
      token_group.CodeLocation,
      PrimitiveName.parse(type_name)
    );
    token_group = token_group.Next;

    let body: string = token_group.Text;
    if (!body.startsWith("`") || !body.endsWith("`"))
      throw new ParserError(
        token_group.CodeLocation,
        "Expected a back-tick string"
      );

    token_group = token_group.Next;

    return [
      token_group,
      new CFunction(
        token_group.CodeLocation,
        options,
        includes,
        name,
        parameters,
        body.substring(1, body.length - 1),
        returns
      ),
    ];
  },
});
