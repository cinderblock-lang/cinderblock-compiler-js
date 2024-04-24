import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement } from "../../writer/statement";
import { LinkedSubStatement } from "../statement/sub";
import { LinkedType } from "../type/base";
import { LinkedExpression } from "./base";

export class LinkedSubExpression extends LinkedExpression {
  readonly #statement: LinkedSubStatement;

  constructor(ctx: CodeLocation, statement: LinkedSubStatement) {
    super(ctx);
    this.#statement = statement;
  }

  get Type(): LinkedType {
    return this.#statement.Type;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let statement: WriterStatement;
    [file, func, statement] = this.#statement.Build(file, func);
    return [
      file,
      func.WithStatement(statement),
      new WriterReferenceExpression(this.#statement),
    ];
  }
}
