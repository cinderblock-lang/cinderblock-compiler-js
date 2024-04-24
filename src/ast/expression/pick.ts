import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { Block } from "../block";

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
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "pick";
  },
  Extract(token_group, prefix, look_for) {
    const [after_target, target] = Type.Parse(token_group);

    after_target.Expect(".");

    const key = after_target.Next.Text;

    const [after_block, block] = Block.Parse(after_target.Skip(2));

    return [
      after_block,
      new PickExpression(token_group.CodeLocation, target, key, block),
    ];
  },
});
