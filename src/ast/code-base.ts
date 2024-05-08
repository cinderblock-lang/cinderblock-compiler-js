import "./entity/enum";
import "./entity/function";
import "./entity/c-function";
import "./entity/schema";
import "./entity/struct";
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
import "./expression/match";
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

import { Namespace } from "./namespace";
import { TokenGroup } from "../parser/token";
import { Component } from "./component";
import { Context } from "./context";
import { LinkerError } from "../linker/error";
import { EmptyCodeLocation } from "../location/empty";
import { Scope } from "./scope";
import { Callstack } from "./callstack";

export class CodeBase {
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

  With(tokens: TokenGroup) {
    let result: Array<Namespace> = [];
    while (!tokens.Done) {
      let namespace: Namespace;
      [tokens, namespace] = Namespace.Parse(tokens);
      result = [...result, namespace];
      tokens = tokens.Next;
    }

    return new CodeBase(...result, ...this.#data);
  }

  GetNamespaceForFunc(func: Component) {
    return this.#data.find((n) => n.IncludesFunction(func));
  }

  GetNamespace(name: string) {
    return this.#data.find((n) => n.Name === name);
  }

  get Linked() {
    const app = this.GetNamespace("App");
    if (!app)
      throw new LinkerError(
        EmptyCodeLocation,
        "error",
        "Could not resolve App namespace"
      );

    const context = new Context(
      this,
      app,
      new Scope({}, {}, undefined),
      new Callstack([], [], 0)
    );

    const result = app.GetMain().Linked(context, true);
    return result.Response;
  }
}
