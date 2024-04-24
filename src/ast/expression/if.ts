import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";

export class IfExpression extends Expression {
  readonly #check: Expression;
  readonly #if: Block;
  readonly #else: Block;

  constructor(
    ctx: CodeLocation,
    check: Expression,
    on_if: Block,
    on_else: Block
  ) {
    super(ctx);
    this.#check = check;
    this.#if = on_if;
    this.#else = on_else;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "if";
  },
  Extract(token_group, prefix) {
    token_group = token_group.Next;
    token_group.Expect("(");

    let check: Expression;
    [token_group, check] = Expression.Parse(token_group.Next, [")"]);

    let if_block: Block;
    [token_group, if_block] = Block.Parse(token_group.Next);

    token_group.Expect("else");

    let else_block: Block;
    [token_group, else_block] = Block.Parse(token_group.Next, false);

    return [
      token_group,
      new IfExpression(token_group.CodeLocation, check, if_block, else_block),
    ];
  },
});
