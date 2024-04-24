import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedFunctionType } from "../type/function";
import { LinkerError } from "../../linker/error";
import { WriterFunction } from "../../writer/entity";
import {
  WriterExpression,
  WriterInvokationExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";

export class LinkedInvokationExpression extends LinkedExpression {
  readonly #subject: LinkedExpression;
  readonly #parameters: Array<LinkedExpression>;

  constructor(
    ctx: CodeLocation,
    subject: LinkedExpression,
    parameters: Array<LinkedExpression>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#parameters = parameters;
  }

  get Type() {
    const subject_type = this.#subject.Type;
    if (!(subject_type instanceof LinkedFunctionType))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only invoke functions"
      );

    return subject_type.Returns;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let parameters: Array<WriterExpression>;
    [file, func, parameters] = this.#parameters.reduce(
      ([ci, cf, cp], n) => {
        const [i, f, p] = n.Build(ci, cf);

        return [i, f, [...cp, p]];
      },
      [file, func, []] as [WriterFile, WriterFunction, Array<WriterExpression>]
    );

    let subject: WriterExpression;
    [file, func, subject] = this.#subject.Build(file, func);

    return [file, func, new WriterInvokationExpression(subject, parameters)];
  }
}
