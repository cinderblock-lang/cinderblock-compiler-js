import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { LinkedParameter } from "../parameter";
import { LinkedType } from "../type/base";
import { LinkedExpression } from "./base";

export class LinkedParameterExpression extends LinkedExpression {
  readonly #parameter: LinkedParameter;

  constructor(ctx: CodeLocation, statement: LinkedParameter) {
    super(ctx);
    this.#parameter = statement;
  }

  get Type(): LinkedType {
    return this.#parameter.Type;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    return [file, func, new WriterReferenceExpression(this.#parameter)];
  }
}
