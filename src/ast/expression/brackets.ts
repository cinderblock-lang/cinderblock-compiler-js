import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Scope } from "../../linker/closure";
import {
  WriterExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";
import { WriterFunction } from "../../writer/entity";
import { WriterVariableStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";

export class BracketsExpression extends Expression {
  readonly #expression: Expression;

  constructor(ctx: CodeLocation, expression: Expression) {
    super(ctx);
    this.#expression = expression;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.#expression.ResolvesTo(scope).Build(file, scope);
    let expression: WriterExpression;
    [file, func, expression] = this.#expression.Build(file, func, scope);
    func = func.WithStatement(
      new WriterVariableStatement(this.CName, type, expression)
    );

    return [file, func, new WriterReferenceExpression(this)];
  }

  ResolvesTo(scope: Scope): Type {
    return this.#expression.ResolvesTo(scope);
  }
}

Expression.Register({
  Priority: 1,
  Is(token_group, prefix) {
    return token_group.Text === "(" && !prefix;
  },
  Extract(token_group, prefix) {
    const [result_tokens, input] = Expression.Parse(token_group.Next, [")"]);

    return [
      result_tokens,
      new BracketsExpression(token_group.CodeLocation, input),
    ];
  },
});
