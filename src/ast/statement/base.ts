import { LinkedStatement } from "../../linked-ast/statement/base";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token";
import { Component } from "../component";
import { Context } from "../context";
import { ContextResponse } from "../context-response";
import { Scope } from "../scope";

export interface IBaseable {
  Is(token_group: TokenGroup): boolean;
  Extract(token_group: TokenGroup): [TokenGroup, Statement];
}

export abstract class Statement extends Component {
  abstract Linked(context: Context): ContextResponse<LinkedStatement>;

  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance];
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Statement] {
    for (const possible of Statement.#possible)
      if (possible.Is(token_group)) return possible.Extract(token_group);

    throw new ParserError(
      token_group.CodeLocation,
      "No statement candidate for " + token_group.Text
    );
  }
}
