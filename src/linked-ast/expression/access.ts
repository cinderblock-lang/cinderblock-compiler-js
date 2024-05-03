import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterAccessExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { LinkedProperty } from "../property";
import { LinkedExpression } from "./base";

export class LinkedAccessExpression extends LinkedExpression {
  readonly #subject: LinkedExpression;
  readonly #target: LinkedProperty;

  constructor(
    ctx: CodeLocation,
    subject: LinkedExpression,
    target: LinkedProperty
  ) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Type() {
    return this.#target.Type;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let subject: WriterExpression;
    [file, func, subject] = this.#subject.Build(file, func);

    return [
      file,
      func,
      new WriterAccessExpression(subject, this.#target.CName),
    ];
  }
}
