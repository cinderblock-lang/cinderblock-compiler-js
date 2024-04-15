import { Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement, WriterSideEffect } from "../../writer/statement";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class SideStatement extends Statement {
  readonly #value: Expression;

  constructor(ctx: CodeLocation, value: Expression) {
    super(ctx);
    this.#value = value;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterStatement] {
    let value: WriterExpression;
    [file, value] = this.#value.Build(file, scope);
    return [file, new WriterSideEffect(value)];
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "side";
  },
  Extract(token_group) {
    const [after_expression, expression] = Expression.Parse(token_group.Next);

    return [
      after_expression,
      new SideStatement(token_group.CodeLocation, expression),
    ];
  },
});
