import { LinkedType } from "../../linked-ast/type/base";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token-group";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Component } from "../component";
import { Context } from "../context";
import { ContextResponse } from "../context-response";

export interface IBaseable {
  Priority: number;
  Is(token_group: TokenGroup): boolean;
  Extract(token_group: TokenGroup): TokenGroupResponse<Type>;
}

export abstract class Type extends Component {
  abstract Linked(context: Context): ContextResponse<LinkedType>;

  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance].sort(
      (a, b) => b.Priority - a.Priority
    );
  }

  static Parse(token_group: TokenGroup): TokenGroupResponse<Type> {
    for (const possible of this.#possible)
      if (possible.Is(token_group)) return possible.Extract(token_group);

    throw new ParserError(
      token_group.CodeLocation,
      "No type candidate for " + token_group.Text
    );
  }
}
