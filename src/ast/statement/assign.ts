import { CodeLocation } from "../../location/code-location";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class AssignStatement extends Statement {
  readonly #name: string;
  readonly #equals: Expression;

  constructor(ctx: CodeLocation, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Text === "assign";
  },
  Extract(token_group) {
    const name = token_group.Next.Text;
    token_group.Skip(2).Expect("=");

    const [after_expression, expression] = Expression.Parse(
      token_group.Skip(3)
    );

    return [
      after_expression,
      new AssignStatement(token_group.CodeLocation, name, expression),
    ];
  },
});
