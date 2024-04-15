import { Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterReturnStatement, WriterStatement } from "../../writer/statement";
import { Expression } from "../expression/base";
import { Type } from "../type/base";
import { Statement } from "./base";

export class ReturnStatement extends Statement {
  readonly #value: Expression;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  ResolveType(scope: Scope): Type {
    return this.#value.ResolvesTo(scope);
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterStatement] {
    let value: WriterExpression;
    [file, func, value] = this.#value.Build(file, func, scope);
    return [file, func, new WriterReturnStatement(value)];
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "return";
  },
  Extract(token_group) {
    const [after_expression, expression] = Expression.Parse(token_group.Next);

    return [
      after_expression,
      new ReturnStatement(token_group.CodeLocation, expression),
    ];
  },
});
