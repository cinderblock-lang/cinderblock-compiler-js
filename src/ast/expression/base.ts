import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token";
import { Component } from "../component";

export interface IBaseable {
  Priority: number;
  Is(
    token_group: TokenGroup,
    prefix: Expression | undefined,
    look_for: Array<string>
  ): boolean;
  Extract(
    token_group: TokenGroup,
    prefix: Expression | undefined,
    look_for: Array<string>
  ): [TokenGroup, Expression];
}

export abstract class Expression extends Component {
  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance].sort(
      (a, b) => b.Priority - a.Priority
    );
  }

  static Parse(
    token_group: TokenGroup,
    look_for: Array<string> = [";"],
    prefix?: Expression
  ): [TokenGroup, Expression] {
    if (look_for.includes(token_group.Text))
      if (!prefix)
        throw new ParserError(
          token_group.CodeLocation,
          "Unexpected end of expression"
        );
      else return [token_group.Next, prefix];

    for (const possible of this.#possible)
      if (possible.Is(token_group, prefix, look_for)) {
        let expression: Expression;
        [token_group, expression] = possible.Extract(
          token_group,
          prefix,
          look_for
        );

        if (look_for.includes(token_group.Text))
          return [token_group, expression];
        else return Expression.Parse(token_group, look_for, expression);
      }

    throw new ParserError(
      token_group.CodeLocation,
      "No expression candidate for " + token_group.Text
    );
  }
}
