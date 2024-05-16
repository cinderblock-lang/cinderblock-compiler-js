import { LinkedStatement } from "../../linked-ast/statement/base";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token-group";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Component } from "../component";
import { Context } from "../context";
import { ContextResponse } from "../context-response";

export interface IBaseable {
  Is(token_group: TokenGroup): boolean;
  Extract(token_group: TokenGroup): TokenGroupResponse<Statement>;
}

export abstract class Statement extends Component {
  abstract Linked(context: Context): ContextResponse<LinkedStatement>;

  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance];
  }

  static Parse(token_group: TokenGroup): TokenGroupResponse<Statement> {
    for (const possible of Statement.#possible)
      if (possible.Is(token_group)) return possible.Extract(token_group);

    throw new ParserError(
      token_group.CodeLocation,
      "No statement candidate for " + token_group.Text
    );
  }
}
