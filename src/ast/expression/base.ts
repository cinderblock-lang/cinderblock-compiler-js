import { Scope } from "../../linker/closure";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token";
import { WriterFunction } from "../../writer/entity";
import { WriterExpression } from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Component } from "../component";
import { Type } from "../type/base";

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
  abstract Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression];

  abstract ResolvesTo(scope: Scope): Type;

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
