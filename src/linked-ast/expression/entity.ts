import { CodeLocation } from "../../location/code-location";
import { LinkedEntity } from "../entity/base";
import { LinkedType } from "../type/base";
import { LinkedExpression } from "./base";

export class EntityExpression extends LinkedExpression {
  readonly #entity: LinkedEntity;

  constructor(ctx: CodeLocation, entity: LinkedEntity) {
    super(ctx);
    this.#entity = entity;
  }

  get Type(): LinkedType {
    return this.#entity.Type;
  }
}
