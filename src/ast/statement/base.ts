import { LinkedStatement } from "../../linked-ast/statement/base";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token";
import { CallStack } from "../callstack";
import { Component } from "../component";
import { Scope } from "../scope";

export interface IBaseable {
  Is(token_group: TokenGroup): boolean;
  Extract(token_group: TokenGroup): [TokenGroup, Statement];
}

export abstract class Statement extends Component {
  abstract Linked(scope: Scope, callstack: CallStack): [Scope, LinkedStatement];

  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance];
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Statement] {
    for (const possible of Statement.#possible)
      if (possible.Is(token_group)) return possible.Extract(token_group);

    throw new ParserError(
      token_group.CodeLocation,
      "No entity candidate for " + token_group.Text
    );
  }
}
