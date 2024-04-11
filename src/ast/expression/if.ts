import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { ParserError } from "../../parser/error";
import { Statement } from "../statement/base";
import { ReturnStatement } from "../statement/return";

export class IfExpression extends Expression {
  readonly #check: Component;
  readonly #if: ComponentGroup;
  readonly #else: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    check: Expression,
    on_if: ComponentGroup,
    on_else: ComponentGroup
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
    if (token_group.Next.Text !== "(")
      throw ParserError.UnexpectedSymbol(token_group.Next, "(");

    const [after_statement, check] = Expression.Parse(token_group.Next.Next, [
      ")",
    ]);

    const [after_if, if_block] =
      ComponentGroup.ParseOptionalExpression(after_statement);

    if (after_if.Text !== "else")
      throw ParserError.UnexpectedSymbol(after_if, "else");

    const [after_else, else_block] = ComponentGroup.ParseOptionalExpression(
      after_if.Next
    );

    return [
      after_else,
      new IfExpression(token_group.CodeLocation, check, if_block, else_block),
    ];
  },
});
