import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement, WriterAssignStatement } from "../../writer/statement";
import { LinkedExpression } from "../expression/base";
import { LinkedMakeExpression } from "../expression/make";
import { LinkedProperty } from "../property";
import { LinkedStatement } from "./base";

export class LinkedAssignStatement extends LinkedStatement {
  readonly #name: string;
  readonly #equals: LinkedExpression;
  readonly #target: LinkedMakeExpression;
  readonly #property: LinkedProperty;

  constructor(
    ctx: CodeLocation,
    name: string,
    equals: LinkedExpression,
    target: LinkedMakeExpression,
    property: LinkedProperty
  ) {
    super(ctx);
    this.#name = name;
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
      new WriterAssignStatement(this.#target.CName, this.#name, value),
    ];
  }
}
