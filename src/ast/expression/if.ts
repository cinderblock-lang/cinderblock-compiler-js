import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Closure } from "../closure";
import { Scope } from "../../linker/closure";
import {
  WriterExpression,
  WriterFunctionReferenceExpression,
  WriterInvokationExpression,
  WriterTernayExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";
import { WriterFunction } from "../../writer/entity";
import { WriterType } from "../../writer/type";
import { WriterStatement } from "../../writer/statement";

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

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.ResolvesTo(scope).Build(file, scope);

    let if_func = new WriterFunction(this.CName + "_true", [], type, [], func);
    let if_statements: Array<WriterStatement>;
    [file, if_func, if_statements] = this.#if.Build(
      file,
      if_func,
      scope.With(this.#if)
    );
    file = file.WithEntity(if_func.WithStatements(if_statements));

    let else_func = new WriterFunction(
      this.CName + "_false",
      [],
      type,
      [],
      func
    );
    let else_statements: Array<WriterStatement>;
    [file, else_func, else_statements] = this.#else.Build(
      file,
      else_func,
      scope.With(this.#else)
    );
    file = file.WithEntity(else_func.WithStatements(else_statements));

    let check_expression: WriterExpression;
    [file, func, check_expression] = this.#check.Build(file, func, scope);

    return [
      file,
      func,
      new WriterTernayExpression(
        check_expression,
        new WriterInvokationExpression(
          new WriterFunctionReferenceExpression(if_func),
          []
        ),
        new WriterInvokationExpression(
          new WriterFunctionReferenceExpression(else_func),
          []
        )
      ),
    ];
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
