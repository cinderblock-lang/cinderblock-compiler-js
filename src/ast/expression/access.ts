import { Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { WriterFunction } from "../../writer/entity";
import {
  WriterAccessExpression,
  WriterExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { FunctionEntity } from "../entity/function";
import { StructEntity } from "../entity/struct";
import { Parameter } from "../parameter";
import { SubStatement } from "../statement/sub";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { Expression } from "./base";
import { ReferenceExpression } from "./reference";

export class AccessExpression extends Expression {
  readonly #subject: Expression;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Subject() {
    return this.#subject;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    const type = this.#subject.ResolvesTo(scope).ResolveConcrete(scope);
    if (!(type instanceof StructEntity)) {
      return new ReferenceExpression(this.CodeLocation, this.#target).Build(
        file,
        func,
        scope
      );
    }

    const property = type.GetKey(this.#target);
    if (!property) {
      return new ReferenceExpression(this.CodeLocation, this.#target).Build(
        file,
        func,
        scope
      );
    }

    let subject: WriterExpression;
    [file, func, subject] = this.#subject.Build(file, func, scope);

    return [file, func, new WriterAccessExpression(subject, property.CName)];
  }

  ResolvesTo(scope: Scope): Type {
    const subject_type = this.#subject.ResolvesTo(scope);

    if (!(subject_type instanceof StructEntity)) {
      const func = scope.Resolve(this.#target);
      if (func instanceof FunctionEntity) return func.ResolvesTo(scope);
      if (func instanceof SubStatement) {
        const type = func.Type(scope);
        if (type instanceof FunctionType) return type;
      }

      if (func instanceof Parameter) {
        const type = func.Type;
        if (type instanceof FunctionType) return type;
      }

      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May not access on anything other than a struct"
      );
    }

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
