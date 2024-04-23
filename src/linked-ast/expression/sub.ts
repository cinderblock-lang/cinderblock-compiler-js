import { CodeLocation } from "../../location/code-location";
import { Entity } from "../entity/base";
import { SubStatement } from "../statement/sub";
import { Type } from "../type/base";
import { Expression } from "./base";

export class SubExpression extends Expression {
  readonly #statement: SubStatement;

  constructor(ctx: CodeLocation, statement: SubStatement) {
    super(ctx);
    this.#statement = statement;
  }

  get Type(): Type {
    return this.#statement.Type;
  }
}
