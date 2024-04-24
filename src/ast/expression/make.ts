import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Block } from "../block";

export class MakeExpression extends Expression {
  readonly #struct: Type;
  readonly #using: Block;

  constructor(ctx: CodeLocation, struct: Type, using: Block) {
    super(ctx);
    this.#struct = struct;
    this.#using = using;
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
