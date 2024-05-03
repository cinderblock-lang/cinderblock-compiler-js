import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement, WriterReturnStatement } from "../../writer/statement";
import { LinkedExpression } from "../expression/base";
import { LinkedStatement } from "./base";

export class LinkedReturnStatement extends LinkedStatement {
  readonly #value: LinkedExpression;

  constructor(ctx: CodeLocation, value: LinkedExpression) {
    super(ctx);
    this.#value = value;
  }

  get Type() {
    return this.#value.Type;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterStatement] {
    let value: WriterExpression;
    [file, func, value] = this.#value.Build(file, func);
    return [file, func, new WriterReturnStatement(value)];
  }
}
