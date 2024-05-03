import { LinkerError } from "../../linker/error";
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
import { LinkedStatement } from "./base";

export class LinkedSubStatement extends LinkedStatement {
  readonly #name: string;
  #equals: LinkedExpression | undefined;

  #inserted = false;

  constructor(ctx: CodeLocation, name: string, equals?: LinkedExpression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }

  get Type() {
    if (!this.#equals)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve type"
      );
    return this.#equals.Type;
  }

  set Equals(value: LinkedExpression) {
    this.#equals = value;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterStatement] {
    if (!this.#equals)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Sub statement not fully resolved"
      );
    if (this.#inserted) return [file, func, new WriterEmptyStatement()];

    this.#inserted = true;
    let assignment: WriterExpression;
    [file, func, assignment] = this.#equals.Build(file, func);
    let type: WriterType;
    [file, type] = this.Type.Build(file);

    const result = new WriterVariableStatement(this.CName, type, assignment);
    return [file, func, result];
  }
}
