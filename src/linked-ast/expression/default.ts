import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction, WriterString } from "../../writer/entity";
import {
  WriterExpression,
  WriterLiteralExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { LinkedType } from "../type/base";
import { LinkedEnumType } from "../type/enum";
import { LinkedFunctionType } from "../type/function";
import { LinkedPrimitiveType } from "../type/primitive";
import { LinkedStructType } from "../type/struct";
import { LinkedExpression } from "./base";

export class DefaultExpression extends LinkedExpression {
  readonly #subject: LinkedType;

  constructor(ctx: CodeLocation, subject: LinkedType) {
    super(ctx);
    this.#subject = subject;
  }

  get Type() {
    return this.#subject;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    const concrete = this.#subject;

    if (
      concrete instanceof LinkedEnumType ||
      concrete instanceof LinkedFunctionType ||
      concrete instanceof LinkedStructType
    ) {
      return [file, func, new WriterLiteralExpression("NULL")];
    }

    if (concrete instanceof LinkedPrimitiveType) {
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
}
