import { Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { StructEntity } from "../entity/struct";
import { Type } from "../type/base";
import { Expression } from "./base";

export class AccessExpression extends Expression {
  readonly #subject: Expression;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    throw new Error("Method not implemented.");
  }

  ResolvesTo(scope: Scope): Type {
    const subject_type = this.#subject.ResolvesTo(scope);

    if (!(subject_type instanceof StructEntity))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May not access on anything other than a struct"
      );

    const property = subject_type.GetKey(this.#target);
    if (!property)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve propery"
      );

    return property.Type;
  }
}

Expression.Register({
  Priority: 2,
  Is(token_group) {
    return token_group.Text === ".";
  },
  Extract(token_group, prefix) {
    if (!prefix)
      throw new ParserError(
        token_group.CodeLocation,
        "Attempting an access without a left hand side"
      );

    const accessed = token_group.Next;

    return [
      accessed.Next,
      new AccessExpression(accessed.CodeLocation, prefix, accessed.Text),
    ];
  },
});
