import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Block } from "../block";
import { SubStatement } from "../statement/sub";
import { Context } from "../context";
import { LinkedBlock } from "../../linked-ast/block";
import { ContextResponse } from "../context-response";
import { LinkedMatchExpression } from "../../linked-ast/expression/match";
import { LinkedSubStatement } from "../../linked-ast/statement/sub";
import { LinkerError } from "../../linker/error";

export class MatchExpression extends Expression {
  readonly #subject: SubStatement;
  readonly #using: Record<string, Block>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    as: string,
    using: Record<string, Block>
  ) {
    super(ctx);
    this.#subject = new SubStatement(this.CodeLocation, as, subject);
    this.#using = using;
  }

  Linked(context: Context) {
    return context.Build(
      {
        subject: (c) => this.#subject.Linked(c),
        using: (ctx) =>
          new ContextResponse(
            ctx,
            Object.keys(this.#using).reduce(
              (c, n) => ({ ...c, [n]: this.#using[n].Linked(ctx).Response }),
              {} as Record<string, LinkedBlock>
            )
          ),
      },
      ({ subject, using }) => {
        if (!(subject instanceof LinkedSubStatement))
          throw new LinkerError(
            this.CodeLocation,
            "error",
            "Subject must be a sub statement"
          );
        return new LinkedMatchExpression(this.CodeLocation, subject, using);
      }
    );
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

    const using: Record<string, Block> = {};
    while (after_using.Text !== "}") {
      const name = after_using.Next.Text;
      after_using.Skip(2).Expect(":");
      const [after_block, block] = Block.Parse(after_subject.Skip(3));

      using[name] = block;
      after_using = after_block;
    }

    return [
      after_using,
      new MatchExpression(token_group.CodeLocation, subject, as, using),
    ];
  },
});
