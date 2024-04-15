import { Scope } from "../../linker/closure";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { WriterFunction, WriterString } from "../../writer/entity";
import {
  WriterExpression,
  WriterLiteralExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { EnumEntity } from "../entity/enum";
import { FunctionEntity } from "../entity/function";
import { StructEntity } from "../entity/struct";
import { Type } from "../type/base";
import { PrimitiveType } from "../type/primitive";
import { Expression } from "./base";

export class DefaultExpression extends Expression {
  readonly #subject: Type;

  constructor(ctx: CodeLocation, subject: Type) {
    super(ctx);
    this.#subject = subject;
  }

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    const concrete = this.#subject.ResolveConcrete(scope);

    if (
      concrete instanceof EnumEntity ||
      concrete instanceof StructEntity ||
      concrete instanceof FunctionEntity
    ) {
      return [file, func, new WriterLiteralExpression("NULL")];
    }

    if (concrete instanceof PrimitiveType) {
      switch (concrete.Name) {
        case "int":
        case "uint":
        case "short":
        case "ushort":
        case "char":
        case "ulong":
        case "long":
        case "bool":
          return [file, func, new WriterLiteralExpression("0")];
        case "udouble":
        case "double":
        case "ufloat":
        case "float":
          return [file, func, new WriterLiteralExpression("0.0")];
        case "any":
        case "null":
          return [file, func, new WriterLiteralExpression("NULL")];
        case "string":
          return [
            file.WithEntity(new WriterString(this.CName, "")),
            func,
            new WriterReferenceExpression(this),
          ];
      }
    }

    throw new LinkerError(this.CodeLocation, "error", "Could not resolve type");
  }

  ResolvesTo(scope: Scope): Type {
    return this.#subject;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "default";
  },
  Extract(token_group, prefix) {
    const input_tokens = token_group.Next;
    const [output_tokens, subject] = Type.Parse(input_tokens);
    if (output_tokens.Text !== ")")
      throw new ParserError(output_tokens.CodeLocation, "Expected a ) token");

    return [
      output_tokens.Next,
      new DefaultExpression(token_group.CodeLocation, subject),
    ];
  },
});
