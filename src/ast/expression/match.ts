import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";
export class MatchExpression extends Expression {
  readonly #subject: Expression;
  readonly #as: string;
  readonly #using: Record<string, ComponentGroup>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    as: string,
    using: Record<string, ComponentGroup>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#as = as;
    this.#using = using;
  }
}
