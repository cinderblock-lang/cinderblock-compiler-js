import "./entity/enum";
import "./entity/function";
import "./entity/schema";
import "./entity/struct";
import "./entity/test";
import "./entity/using";

import "./expression/access";
import "./expression/brackets";
import "./expression/closure";
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
import "./statement/panic";
import "./statement/return";
import "./statement/side";
import "./statement/sub";

import "./type/function";
import "./type/primitive";
import "./type/reference";
import "./type/schema";
import "./type/use";

import { Namespace } from "./namespace";
import { TokenGroup } from "../parser/token";

export class Ast {
  readonly #data: Array<Namespace>;

  constructor(token_group: TokenGroup);
  constructor(...data: Array<Namespace>);
  constructor(tokens: TokenGroup | Namespace, ...data: Array<Namespace>) {
    if (tokens instanceof TokenGroup) {
      this.#data = [];
      while (!tokens.Done) {
        let namespace: Namespace;
        [tokens, namespace] = Namespace.Parse(tokens);
        this.#data = [...this.#data, namespace];
      }
    } else {
      this.#data = [tokens, ...data];
    }
  }

  with(tokens: TokenGroup) {
    let result: Array<Namespace> = [];
    while (!tokens.Done) {
      let namespace: Namespace;
      [tokens, namespace] = Namespace.Parse(tokens);
      result = [...result, namespace];
    }

    return new Ast(...result, ...this.#data);
  }
}
