import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Closure } from "../closure";
import { Scope } from "../../linker/closure";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";

export class IfExpression extends Expression {
  readonly #check: Expression;
  readonly #if: Closure;
  readonly #else: Closure;

  constructor(
    ctx: CodeLocation,
    check: Expression,
    on_if: Closure,
    on_else: Closure
  ) {
    super(ctx);
    this.#check = check;
    this.#if = on_if;
    this.#else = on_else;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterExpression] {
    throw new Error("Method not implemented.");
  }

  ResolvesTo(scope: Scope): Type {
    return this.#if.ResolvesTo(scope);
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

    const [after_if, if_block] = Closure.Parse(after_statement);

    if (after_if.Text !== "else")
      throw ParserError.UnexpectedSymbol(after_if, "else");

    const [after_else, else_block] = Closure.Parse(after_if.Next);

    return [
      after_else,
      new IfExpression(token_group.CodeLocation, check, if_block, else_block),
    ];
  },
});
