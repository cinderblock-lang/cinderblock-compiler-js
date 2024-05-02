import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import {
  WriterAllocateExpression,
  WriterExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import {
  WriterStatement,
  WriterEmptyStatement,
  WriterVariableStatement,
} from "../../writer/statement";
import { WriterType } from "../../writer/type";
import { LinkedType } from "../type/base";
import { LinkedStatement } from "./base";

export class LinkedAllocateStatement extends LinkedStatement {
  readonly #type: LinkedType;

  #inserted = false;

  constructor(ctx: CodeLocation, type: LinkedType) {
    super(ctx);
    this.#type = type;
  }

  get Type() {
    return this.#type;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterStatement] {
    if (this.#inserted) return [file, func, new WriterEmptyStatement()];

    this.#inserted = true;
    let type: WriterType;
    [file, type] = this.#type.Build(file);
    let assignment = new WriterAllocateExpression(type);

    const result = new WriterVariableStatement(this.CName, type, assignment);
    return [file, func, result];
  }
}
