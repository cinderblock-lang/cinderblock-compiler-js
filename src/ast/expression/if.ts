import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { Context } from "../context";
import { LinkedIfExpression } from "../../linked-ast/expression/if";

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

  Linked(context: Context) {
    return context.Build(
      {
        check: (c) => this.#check.Linked(c),
        if_block: (c) => this.#if.Linked(c),
        else_block: (c) => this.#else.Linked(c),
      },
      ({ check, if_block, else_block }) =>
        new LinkedIfExpression(this.CodeLocation, check, if_block, else_block)
    );
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "if";
  },
  Extract(token_group, prefix) {
    return token_group.Build(
      {
        check: (token_group) => {
          token_group = token_group.Next;
          token_group.Expect("(");
          return Expression.Parse(token_group.Next, [")"]);
        },
        if_block: (token_group) => Block.Parse(token_group),
        else_block: (token_group) => {
          if (token_group.Text === ";") token_group = token_group.Next;

          token_group.Expect("else");
          token_group = token_group.Next;
          return Block.Parse(token_group);
        },
      },
      ({ check, if_block, else_block }) =>
        new IfExpression(token_group.CodeLocation, check, if_block, else_block)
    );
  },
});
