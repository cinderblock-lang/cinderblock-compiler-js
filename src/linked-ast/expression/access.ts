import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { StructType } from "../type/struct";
import { Expression } from "./base";

export class AccessExpression extends Expression {
  readonly #subject: Expression;
  readonly #target: string;

  constructor(ctx: CodeLocation, subject: Expression, target: string) {
    super(ctx);
    this.#subject = subject;
    this.#target = target;
  }

  get Type() {
    const subject_type = this.#subject.Type;

    if (!(subject_type instanceof StructType))
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
}
