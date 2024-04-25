import { LinkedType } from "../../linked-ast/type/base";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token";
import { CallStack } from "../callstack";
import { Component } from "../component";
import { Scope } from "../scope";

export interface IBaseable {
  Priority: number;
  Is(token_group: TokenGroup): boolean;
  Extract(token_group: TokenGroup): [TokenGroup, Type];
}

export abstract class Type extends Component {
  abstract Linked(scope: Scope, callstack: CallStack): [Scope, LinkedType];

  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance].sort(
      (a, b) => b.Priority - a.Priority
    );
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Type] {
    for (const possible of this.#possible)
      if (possible.Is(token_group)) return possible.Extract(token_group);

    throw new ParserError(
      token_group.CodeLocation,
      "No type candidate for " + token_group.Text
    );
  }
}
