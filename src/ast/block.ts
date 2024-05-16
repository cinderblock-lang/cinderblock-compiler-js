import { TokenGroup } from "../parser/token-group";
import { Statement } from "./statement/base";
import { ReturnStatement } from "./statement/return";
import { Expression } from "./expression/base";
import { LinkedBlock } from "../linked-ast/block";
import { LinkerError } from "../linker/error";
import { ContextResponse } from "./context-response";
import { Context } from "./context";
import { LinkedType } from "../linked-ast/type/base";
import { TokenGroupResponse } from "../parser/token-group-response";

export class Block {
  readonly #components: Array<Statement>;

  constructor(...components: Array<Statement>) {
    this.#components = components;
  }

  Linked(context: Context) {
    return context.Build(
      {
        content: (context) =>
          context.Map(this.#components, (ctx, n) => n.Linked(ctx)),
      },
      ({ content }) => new ContextResponse(context, new LinkedBlock(content))
    );
  }

  Returns(context: Context): ContextResponse<LinkedType> {
    const result = this.#components
      .map((c) =>
        c instanceof ReturnStatement ? c.ReturnType(context) : undefined
      )
      .find((c) => !!c);

    if (!result)
      throw new LinkerError(
        this.#components[0].CodeLocation,
        "error",
        "Unable to determine return type"
      );

    return result;
  }

  static Parse(token_group: TokenGroup): TokenGroupResponse<Block> {
    if (token_group.Text !== "{") {
      let expression: Expression;
      [token_group, expression] = Expression.Parse(token_group, [
        ";",
      ]).Destructured;

      return new TokenGroupResponse(
        token_group,
        new Block(new ReturnStatement(token_group.CodeLocation, expression))
      );
    }

    const result: Array<Statement> = [];
    token_group = token_group.Next;

    while (token_group.Text !== "}") {
      let r: Statement;
      [token_group, r] = Statement.Parse(token_group).Destructured;
      result.push(r);
    }

    return new TokenGroupResponse(token_group, new Block(...result));
  }
}
