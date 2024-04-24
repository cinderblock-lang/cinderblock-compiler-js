import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterVariableStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";

export class LinkedBracketsExpression extends LinkedExpression {
  readonly #expression: LinkedExpression;

  constructor(ctx: CodeLocation, expression: LinkedExpression) {
    super(ctx);
    this.#expression = expression;
  }

  get Type() {
    return this.#expression.Type;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.#expression.Type.Build(file);
    let expression: WriterExpression;
    [file, func, expression] = this.#expression.Build(file, func);
    func = func.WithStatement(
      new WriterVariableStatement(this.CName, type, expression)
    );

    return [file, func, new WriterReferenceExpression(this)];
  }
}
