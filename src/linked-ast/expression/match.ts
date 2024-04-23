import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { SubStatement } from "../statement/sub";
import { LinkedType } from "../type/base";

export class MatchExpression extends LinkedExpression {
  readonly #subject: SubStatement;
  readonly #using: Record<string, Block>;

  constructor(
    ctx: CodeLocation,
    subject: LinkedExpression,
    as: string,
    using: Record<string, Block>
  ) {
    super(ctx);
    this.#subject = new SubStatement(
      this.CodeLocation,
      as,
      subject,
      subject.Type
    );
    this.#using = using;
  }

  get Type(): LinkedType {
    const [key] = Object.keys(this.#using);

    return this.#using[key].Returns;
  }
}
