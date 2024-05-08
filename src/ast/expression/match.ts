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
import { LinkedParameter } from "../../linked-ast/parameter";
import { LinkedEnumType } from "../../linked-ast/type/enum";
import { LinkedParameterExpression } from "../../linked-ast/expression/parameter";

export class MatchExpression extends Expression {
  readonly #subject: Expression;
  readonly #as: string;
  readonly #using: Record<string, Block>;

  constructor(
    ctx: CodeLocation,
    subject: Expression,
    as: string,
    using: Record<string, Block>
  ) {
    super(ctx);
    this.#subject = subject;
    this.#as = as;
    this.#using = using;
  }

  Linked(context: Context) {
    return context.Build(
      {
        subject: (c) => this.#subject.Linked(c),
        using: (ctx) =>
          new ContextResponse(
            ctx,
            Object.keys(this.#using).reduce((c, n) => {
              const sub = this.#subject.Linked(ctx);
              const type = sub.Response.Type;
              if (!(type instanceof LinkedEnumType))
                throw new LinkerError(
                  this.CodeLocation,
                  "error",
                  "May only match on an enum"
                );

              const property = type.GetKey(n);
              if (!property)
                throw new LinkerError(
                  this.CodeLocation,
                  "error",
                  "Key not present"
                );
              const result = new LinkedParameter(
                this.CodeLocation,
                this.#as,
                property.Type,
                false
              );
              return {
                ...c,
                [n]: this.#using[n].Linked(
                  ctx.WithObject(
                    this.#as,
                    new LinkedParameterExpression(this.CodeLocation, result)
                  )
                ).Response,
              };
            }, {} as Record<string, LinkedBlock>)
          ),
      },
      ({ subject, using }) => {
        return new LinkedMatchExpression(
          this.CodeLocation,
          subject,
          this.CodeLocation.CName,
          using
        );
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
    const location = token_group.CodeLocation;
    token_group.Next.Expect("(");
    let subject: Expression;
    [token_group, subject] = Expression.Parse(token_group.Skip(2), ["as"]);

    token_group = token_group.Next;
    const as = token_group.Text;

    token_group = token_group.Skip(2);
    token_group.Expect("{");
    token_group = token_group.Next;

    const using: Record<string, Block> = {};
    while (token_group.Text !== "}") {
      const name = token_group.Text;
      token_group = token_group.Next;
      token_group.Expect(":");
      let block: Block;
      [token_group, block] = Block.Parse(token_group.Next);

      using[name] = block;
    }

    token_group = token_group.Next;

    return [token_group, new MatchExpression(location, subject, as, using)];
  },
});
