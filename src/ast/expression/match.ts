import { Expression } from "./base";
import { ComponentGroup } from "../component-group";
import { CodeLocation } from "../../location/code-location";
export class MatchExpression extends Expression {
  readonly #subject: Expression;
  readonly #as: string;
  readonly #using: Record<string, ComponentGroup>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    as: string,
    using: Record<string, ComponentGroup>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#as = as;
    this.#using = using;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "match";
  },
  Extract(token_group, prefix) {
    token_group.Next.Expect("(");
    const [after_subject, subject] = Expression.Parse(token_group.Skip(2), [
      "as",
    ]);

    const as = after_subject.Next.Text;

    let after_using = after_subject.Skip(2);
    after_using.Expect("{");

    const using: Record<string, ComponentGroup> = {};
    while (after_using.Text !== "}") {
      const name = after_using.Next.Text;
      after_using.Skip(2).Expect(":");
      const [after_block, block] = ComponentGroup.ParseOptionalExpression(
        after_subject.Skip(3)
      );

      using[name] = block;
      after_using = after_block;
    }

    return [
      after_using,
      new MatchExpression(token_group.CodeLocation, subject, as, using),
    ];
  },
});
