import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement, WriterAssignStatement } from "../../writer/statement";
import { LinkedExpression } from "../expression/base";
import { LinkedProperty } from "../property";
import { LinkedAllocateStatement } from "./allocate";
import { LinkedStatement } from "./base";

export class LinkedAssignStatement extends LinkedStatement {
  readonly #equals: LinkedExpression;
  readonly #target: LinkedAllocateStatement;
  readonly #property: LinkedProperty;

  constructor(
    ctx: CodeLocation,
    property: LinkedProperty,
    equals: LinkedExpression,
    target: LinkedAllocateStatement
  ) {
    super(ctx);
    this.#equals = equals;
    this.#target = target;
    this.#property = property;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterStatement] {
    let value: WriterExpression;
    [file, func, value] = this.#equals.Build(file, func);
    return [
      file,
      func,
      new WriterAssignStatement(
        this.#target.CName,
        this.#property.CName,
        value
      ),
    ];
  }
}
