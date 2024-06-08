import { LinkedExpression } from "../../linked-ast/expression/base";
import { TokeniserContext } from "../../parser/context";
import { ParserError } from "../../parser/error";
import { TokenGroup } from "../../parser/token-group";
import { TokenGroupResponse } from "../../parser/token-group-response";
import { Component } from "../component";
import { Context } from "../context";
import { ContextResponse } from "../context-response";

export interface IBaseable {
  Priority: number;
  Is(
    token_group: TokenGroup,
    prefix: Expression | undefined,
    look_for: Array<string>
  ): boolean;
  Extract(
    token_group: TokenGroup,
    ctx: TokeniserContext,
    prefix: Expression | undefined,
    look_for: Array<string>
  ): TokenGroupResponse<Expression>;
}

export abstract class Expression extends Component {
  abstract Linked(context: Context): ContextResponse<LinkedExpression>;

  static #possible: Array<IBaseable> = [];

  static Register(instance: IBaseable): void {
    this.#possible = [...this.#possible, instance].sort(
      (a, b) => b.Priority - a.Priority
    );
  }

  static Parse(
    token_group: TokenGroup,
    ctx: TokeniserContext,
    look_for: Array<string> = [";"],
    prefix?: Expression
  ): TokenGroupResponse<Expression> {
    if (look_for.includes(token_group.Text))
      if (!prefix)
        throw new ParserError(
          token_group.CodeLocation,
          "Unexpected end of expression"
        );
      else return new TokenGroupResponse(token_group.Next, prefix);

    for (const possible of this.#possible)
      if (possible.Is(token_group, prefix, look_for)) {
        let expression: Expression;
        [token_group, expression] = possible.Extract(
          token_group,
          ctx,
          prefix,
          look_for
        ).Destructured;

        if (look_for.includes(token_group.Text))
          return new TokenGroupResponse(token_group, expression);
        else return Expression.Parse(token_group, ctx, look_for, expression);
      }

    throw new ParserError(
      token_group.CodeLocation,
      "No expression candidate for " + token_group.Text
    );
  }
}
