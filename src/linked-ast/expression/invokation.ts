import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { FunctionType } from "../type/function";
import { LinkerError } from "../../linker/error";

export class InvokationExpression extends LinkedExpression {
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
    if (!(subject_type instanceof FunctionType))
      throw new LinkerError(
        this.CodeLocation,
        "error",
        "May only invoke functions"
      );

    return subject_type.Returns;
  }
}
