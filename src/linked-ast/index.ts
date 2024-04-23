import "./entity/enum";
import "./entity/function";
import "./entity/c-function";
import "./entity/schema";
import "./entity/struct";
import "./entity/test";
import "./entity/using";

import "./expression/access";
import "./expression/brackets";
import "./block";
import "./expression/default";
import "./expression/empty";
import "./expression/if";
import "./expression/invokation";
import "./expression/is";
import "./expression/lambda";
import "./expression/literal";
import "./expression/make";
import "./expression/operator";
import "./expression/pick";
import "./expression/reference";

import "./statement/assign";
import "./statement/return";
import "./statement/side";
import "./statement/sub";

import "./type/function";
import "./type/primitive";
import "./type/reference";
import "./type/schema";
import "./type/use";

import { Entity } from "./entity/base";

export class Ast {
  readonly #data: Array<Entity>;

  constructor(...data: Array<Entity>) {
    this.#data = data;
  }

  With(input: Entity) {
    return new Ast(input, ...this.#data);
  }
}
