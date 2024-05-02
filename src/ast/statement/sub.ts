import { LinkedSubStatement } from "../../linked-ast/statement/sub";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
import { Expression } from "../expression/base";
import { Statement } from "./base";

export class SubStatement extends Statement {
  readonly #name: string;
  readonly #equals: Expression;

  constructor(ctx: CodeLocation, name: string, equals: Expression) {
    super(ctx);
    this.#name = name;
    this.#equals = equals;
  }

  get Name() {
    return this.#name;
  }

  Linked(context: Context) {
    return context.Build(
      {
        equals: (c) => this.#equals.Linked(c),
      },
      ({ equals }) =>
        new LinkedSubStatement(
          this.CodeLocation,
          this.#name,
          equals,
          equals.Type
        )
    );
  }
}

Statement.Register({
  Is(token_group) {
    return token_group.Next.Text === "->";
  },
  Extract(token_group) {
    const name = token_group.Text;
    const [after_expression, expression] = Expression.Parse(
      token_group.Skip(2)
    );

    return [
      after_expression,
      new SubStatement(token_group.CodeLocation, name, expression),
    ];
  },
});
