import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Closure } from "../closure";
import { Scope } from "../../linker/closure";
import {
  WriterExpression,
  WriterGlobalReferenceExpression,
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

    let check_expression: WriterExpression;
    [file, func, check_expression] = this.#check.Build(file, func, scope);

    let if_func = new WriterFunction(this.CName + "_true", [], type, [], func);
    let if_statements: Array<WriterStatement>;
    [file, if_func, if_statements] = this.#if.Build(
      file,
      if_func,
      scope.With(this.#if)
    );
    if_func = if_func.WithStatements(if_statements);
    file = file.WithEntity(if_func);

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
    else_func = else_func.WithStatements(else_statements);
    file = file.WithEntity(else_func);

    return [
      file,
      func,
      new WriterTernayExpression(
        check_expression,
        new WriterInvokationExpression(
          new WriterGlobalReferenceExpression(if_func),
          []
        ),
        new WriterInvokationExpression(
          new WriterGlobalReferenceExpression(else_func),
          []
        )
      ),
    ];
  }

  ResolvesTo(scope: Scope): Type {
    return this.#if.ResolvesTo(scope.With(this.#if));
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

    let if_block: Closure;
    [token_group, if_block] = Closure.Parse(token_group.Next);

    token_group.Expect("else");

    let else_block: Closure;
    [token_group, else_block] = Closure.Parse(token_group.Next, false);

    return [
      token_group,
      new IfExpression(token_group.CodeLocation, check, if_block, else_block),
    ];
  },
});
