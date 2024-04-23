import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { FunctionType } from "../type/function";
import { LinkerError } from "../../linker/error";

export class InvokationExpression extends Expression {
  readonly #subject: Expression;
  readonly #parameters: Array<Expression>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    parameters: Array<Expression>
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
