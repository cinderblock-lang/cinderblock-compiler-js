import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Block } from "../block";
import { Context } from "../context";
import { LinkedPickExpression } from "../../linked-ast/expression/pick";
import { LinkedEnumType } from "../../linked-ast/type/enum";
import { LinkerError } from "../../linker/error";
import { TokenGroupResponse } from "../../parser/token-group-response";

export class PickExpression extends Expression {
  readonly #enum: Type;
  readonly #key: string;
  readonly #using: Block;

  constructor(ctx: CodeLocation, target: Type, key: string, using: Block) {
    super(ctx);
    this.#enum = target;
    this.#key = key;
    this.#using = using;
  }

  Linked(context: Context) {
    return context.Build(
      {
        type: (c) => this.#enum.Linked(c),
        using: (c) => this.#using.Linked(c),
      },
      ({ type, using }) => {
        if (!(type instanceof LinkedEnumType))
          throw new LinkerError(
            this.CodeLocation,
            "error",
            "May only perform a pick on enums"
          );
        return new LinkedPickExpression(
          this.CodeLocation,
          type,
          this.#key,
          using
        );
      }
    );
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "pick";
  },
  Extract(token_group, prefix, look_for) {
    return token_group.Build(
      {
        target: (token_group) => Type.Parse(token_group.Next),
        key: (token_group) => {
          token_group.Expect(".");
          token_group = token_group.Next;
          return TokenGroupResponse.TextItem(token_group);
        },
        block: (token_group) => Block.Parse(token_group),
      },
      ({ target, key, block }) =>
        new PickExpression(token_group.CodeLocation, target, key, block)
    );
  },
});
