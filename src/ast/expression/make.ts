import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Block } from "../block";
import { Context } from "../context";
import { LinkedMakeExpression } from "../../linked-ast/expression/make";
import { LinkedStructType } from "../../linked-ast/type/struct";
import { LinkerError } from "../../linker/error";
import { LinkedAllocateStatement } from "../../linked-ast/statement/allocate";
import { ContextResponse } from "../context-response";

export class MakeExpression extends Expression {
  readonly #struct: Type;
  readonly #using: Block;

  constructor(ctx: CodeLocation, struct: Type, using: Block) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
  }

  Linked(context: Context) {
    const type_response = this.#struct.Linked(context);
    context = type_response.Context;
    const type = type_response.Response;

    if (!(type instanceof LinkedStructType))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only make a struct"
      );
    const allocate = new LinkedAllocateStatement(this.CodeLocation, type);
    return context.WithMake(allocate).Build(
      {
        using: (c) => this.#using.Linked(c),
      },
      ({ using }) =>
        new ContextResponse(
          context,
          new LinkedMakeExpression(this.CodeLocation, allocate, using)
        )
    );
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "make";
  },
  Extract(token_group, prefix) {
    const [after_type, type] = Type.Parse(token_group.Next);

    const [after_using, using] = Block.Parse(after_type);

    return [
      after_using,
      new MakeExpression(token_group.CodeLocation, type, using),
    ];
  },
});
