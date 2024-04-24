import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import {
  WriterStatement,
  WriterEmptyStatement,
  WriterVariableStatement,
} from "../../writer/statement";
import { WriterType } from "../../writer/type";
import { LinkedExpression } from "../expression/base";
import { LinkedType } from "../type/base";
import { LinkedStatement } from "./base";

export class LinkedSubStatement extends LinkedStatement {
  readonly #name: string;
  readonly #equals: LinkedExpression;
  readonly #type: LinkedType;

  #inserted = false;

  constructor(
    ctx: CodeLocation,
    name: string,
    equals: LinkedExpression,
    type: LinkedType
  ) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
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
    let assignment: WriterExpression;
    [file, func, assignment] = this.#equals.Build(file, func);
    let type: WriterType;
    [file, type] = this.#equals.Type.Build(file);

    const result = new WriterVariableStatement(this.CName, type, assignment);
    return [file, func, result];
  }
}
