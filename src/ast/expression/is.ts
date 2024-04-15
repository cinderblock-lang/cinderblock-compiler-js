import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { ParserError } from "../../parser/error";
import { Scope } from "../../linker/closure";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { PrimitiveType } from "../type/primitive";
import { WriterFunction } from "../../writer/entity";

export class IsExpression extends Expression {
  readonly #left: Expression;
  readonly #right: Type;

  constructor(ctx: CodeLocation, left: Expression, right: Type) {
    super(ctx);
    this.#left = left;
    this.#right = right;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    throw new Error("Method not implemented.");
  }

  ResolvesTo(scope: Scope): Type {
    return new PrimitiveType(this.CodeLocation, "bool");
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "is";
  },
  Extract(token_group, prefix) {
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Is checks must have a left hand side"
      );

    const [after_right, right] = Type.Parse(token_group);

    return [
      after_right,
      new IsExpression(token_group.CodeLocation, prefix, right),
    ];
  },
});
