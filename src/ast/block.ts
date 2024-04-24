import { TokenGroup } from "../parser/token";
import { Statement } from "./statement/base";
import { ReturnStatement } from "./statement/return";
import { Expression } from "./expression/base";

export class Block {
  readonly #components: Array<Statement>;

  constructor(...components: Array<Statement>) {
    this.#components = components;
  }

  static Parse(
    token_group: TokenGroup,
    progress_single_line = true
  ): [TokenGroup, Block] {
    if (token_group.Text !== "{") {
      let expression: Expression;
      [token_group, expression] = Expression.Parse(token_group, [";"]);

      return [
        progress_single_line ? token_group.Next : token_group,
        new Block(new ReturnStatement(token_group.CodeLocation, expression)),
      ];
    }

    const result: Array<Statement> = [];
    token_group = token_group.Next;

    while (token_group.Text !== "}") {
      let r: Statement;
      [token_group, r] = Statement.Parse(token_group);
      token_group = token_group.Next;
      result.push(r);
    }

    return [token_group.Next, new Block(...result)];
  }
}
