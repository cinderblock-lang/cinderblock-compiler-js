import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "../type/base";
import { LinkedPrimitiveType } from "../type/primitive";
import { WriterFunction, WriterString } from "../../writer/entity";
import {
  WriterExpression,
  WriterLiteralExpression,
  WriterGlobalReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterType } from "../../writer/type";

export type LiteralType =
  | "string"
  | "int"
  | "char"
  | "float"
  | "double"
  | "long"
  | "bool"
  | "null";

export class LinkedLiteralExpression extends LinkedExpression {
  readonly #type: LiteralType;
  readonly #value: string;

  constructor(ctx: CodeLocation, type: LiteralType, value: string) {
    super(ctx);
    this.#type = type;
    this.#value = value;
  }

  get Type(): LinkedType {
    switch (this.#type) {
      case "string":
        return new LinkedPrimitiveType(this.CodeLocation, "string");
      case "int":
        return new LinkedPrimitiveType(this.CodeLocation, "int");
      case "char":
        return new LinkedPrimitiveType(this.CodeLocation, "char");
      case "float":
        return new LinkedPrimitiveType(this.CodeLocation, "float");
      case "double":
        return new LinkedPrimitiveType(this.CodeLocation, "double");
      case "long":
        return new LinkedPrimitiveType(this.CodeLocation, "long");
      case "bool":
        return new LinkedPrimitiveType(this.CodeLocation, "bool");
      case "null":
        return new LinkedPrimitiveType(this.CodeLocation, "null");
    }
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.Type.Build(file);

    switch (this.#type) {
      case "bool":
        return [
          file,
          func,
          new WriterLiteralExpression(this.#value === "true" ? "1" : "0"),
        ];
      case "char":
        return [file, func, new WriterLiteralExpression(`'${this.#value}'`)];
      case "double":
        return [
          file,
          func,
          new WriterLiteralExpression(this.#value.replace("d", "")),
        ];
      case "float":
        return [file, func, new WriterLiteralExpression(this.#value)];
      case "int":
        return [
          file,
          func,
          new WriterLiteralExpression(this.#value.replace("i", "")),
        ];
      case "long":
        return [file, func, new WriterLiteralExpression(this.#value)];
      case "string":
        const entity = new WriterString(this.CName, this.#value);
        return [
          file.WithEntity(entity),
          func,
          new WriterGlobalReferenceExpression(entity),
        ];
      case "null":
        return [file, func, new WriterLiteralExpression("NULL")];
    }
  }
}
