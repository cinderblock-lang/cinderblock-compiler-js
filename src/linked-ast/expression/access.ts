import { StructEntity } from "../../ast/entity/struct";
import { ReferenceExpression } from "../../ast/expression/reference";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterAccessExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { LinkedStructType } from "../type/struct";
import { LinkedExpression } from "./base";

export class LinkedAccessExpression extends LinkedExpression {
  readonly #subject: LinkedExpression;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: LinkedExpression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Type() {
    const subject_type = this.#subject.Type;

    if (!(subject_type instanceof LinkedStructType))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only access a struct"
      );

    const response_type = subject_type.GetKey(this.#target);
    if (!response_type)
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Cannot find key of struct"
      );

    return response_type.Type;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    const type = this.#subject.Type;
    if (!(type instanceof LinkedStructType)) {
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only access on structs"
      );
    }

    const property = type.GetKey(this.#target);
    if (!property) {
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "Could not resolve property"
      );
    }

    let subject: WriterExpression;
    [file, func, subject] = this.#subject.Build(file, func);

    return [file, func, new WriterAccessExpression(subject, property.CName)];
  }
}
