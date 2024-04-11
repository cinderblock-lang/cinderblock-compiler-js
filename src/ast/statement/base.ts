import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token";
import { Component } from "../component";

export interface IBaseable {
  Is(token_group: TokenGroup): boolean;
  Extract(token_group: TokenGroup): [TokenGroup, Statement];
}

export abstract class Statement extends Component {
  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance];
  }

  static Parse(token_group: TokenGroup): [TokenGroup, Statement] {
    for (const possible of this.#possible)
      if (possible.Is(token_group)) return possible.Extract(token_group);

    throw new ParserError(
      token_group.CodeLocation,
      "No entity candidate for " + token_group.Text
    );
  }
}
