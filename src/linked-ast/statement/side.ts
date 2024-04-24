import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement, WriterSideEffect } from "../../writer/statement";
import { LinkedExpression } from "../expression/base";
import { LinkedStatement } from "./base";

export class LinkedSideStatement extends LinkedStatement {
  readonly #value: LinkedExpression;

  constructor(ctx: CodeLocation, value: LinkedExpression) {
    super(ctx);
    this.#value = value;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterStatement] {
    let value: WriterExpression;
    [file, func, value] = this.#value.Build(file, func);
    return [file, func, new WriterSideEffect(value)];
  }
}
