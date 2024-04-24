import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "../type/base";
import { LinkedPrimitiveType } from "../type/primitive";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterLiteralExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";

export class IsExpression extends LinkedExpression {
  readonly #left: LinkedExpression;
  readonly #right: LinkedType;

  constructor(ctx: CodeLocation, left: LinkedExpression, right: LinkedType) {
    super(ctx);
    this.#left = left;
    this.#right = right;
  }

  get Type() {
    return new LinkedPrimitiveType(this.CodeLocation, "bool");
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    const left = this.#left.Type;
    const right = this.#right;

    if (
      left instanceof LinkedPrimitiveType &&
      right instanceof LinkedPrimitiveType
    ) {
      return [
        file,
        func,
        new WriterLiteralExpression(left.Name === right.Name ? "1" : "0"),
      ];
    }

    return [
      file,
      func,
      new WriterLiteralExpression(left === right ? "1" : "0"),
    ];
  }
}
