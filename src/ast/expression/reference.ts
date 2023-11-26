import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { WriterContext } from "../writer";
import { FunctionParameter } from "../function-parameter";
import { LinkerError } from "../../linker/error";
import { FindReference } from "../../linker/resolve";

export class ReferenceExpression extends Expression {
  readonly #name: string;

  constructor(ctx: CodeLocation, name: string) {
    super(ctx);
    this.#name = name;
  }
  get Name() {
    return this.#name;
  }

  get type_name() {
    return "reference_expression";
  }

  c(ctx: WriterContext): string {
    const target = FindReference(this.Name, ctx);
    if (!target)
      throw new LinkerError(this.CodeLocation, "Could not find reference");
    if (target instanceof FunctionParameter) return this.Name;
    return `(${target.c(ctx)})`;
  }
}
