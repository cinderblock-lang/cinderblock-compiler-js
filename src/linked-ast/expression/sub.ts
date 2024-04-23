import { CodeLocation } from "../../location/code-location";
import { LinkedEntity } from "../entity/base";
import { SubStatement } from "../statement/sub";
import { LinkedType } from "../type/base";
import { LinkedExpression } from "./base";

export class SubExpression extends LinkedExpression {
  readonly #statement: SubStatement;

  constructor(ctx: CodeLocation, statement: SubStatement) {
    super(ctx);
    this.#statement = statement;
  }

  get Type(): LinkedType {
    return this.#statement.Type;
  }
}
