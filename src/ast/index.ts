import "./entity/enum";
import "./entity/function";
import "./entity/schema";
import "./entity/struct";
import "./entity/test";
import "./entity/using";

import "./expression/access";
import "./expression/brackets";
import "./closure";
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

import { Namespace } from "./namespace";
import { TokenGroup } from "../parser/token";
import { WriterFile } from "../writer/file";
import { FunctionEntity } from "./entity/function";
import { LinkerError } from "../linker/error";
import { EmptyCodeLocation } from "../location/empty";
import { WriterFunction } from "../writer/entity";
import { Scope } from "../linker/closure";

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

  With(tokens: TokenGroup) {
    let result: Array<Namespace> = [];
    while (!tokens.Done) {
      let namespace: Namespace;
      [tokens, namespace] = Namespace.Parse(tokens);
      result = [...result, namespace];
      tokens = tokens.Next;
    }

    return new Ast(...result, ...this.#data);
  }

  GetNamespaceForFunction(func: FunctionEntity) {
    const result = this.#data.find((n) => n.Contains(func));
    if (!result)
      throw new LinkerError(
        EmptyCodeLocation,
        "error",
        "Could not find namespace for function"
      );

    return result;
  }

  GetNamespace(name: string) {
    const result = this.#data.find((n) => n.Name === name);
    if (!result)
      throw new LinkerError(
        EmptyCodeLocation,
        "error",
        "Could not find namespace"
      );

    return result;
  }

  get Writer() {
    let result = new WriterFile([], []);

    for (const namespace of this.#data) {
      if (namespace.Name !== "App") continue;

      const main = namespace.Resolve("main", this);
      if (!main || !(main instanceof FunctionEntity))
        throw new LinkerError(
          namespace.CodeLocation,
          "error",
          "No main function"
        );

      let func: WriterFunction;

      [result, func] = main.Declare(result, new Scope(this, [[main, []]], []));
      return result;
    }

    throw new LinkerError(EmptyCodeLocation, "error", "No App namespace");
  }
}
