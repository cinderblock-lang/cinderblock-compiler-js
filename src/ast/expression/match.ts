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
import { TokenGroupResponse } from "../../parser/token-group-response";

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
    return token_group.Build(
      {
        subject: (token_group) => {
          token_group = token_group.Next;
          token_group.Expect("(");
          token_group = token_group.Next;
          return Expression.Parse(token_group, ["as"]);
        },
        as: (token_group) => TokenGroupResponse.TextItem(token_group),
        using: (token_group) => {
          token_group.Expect(")");
          token_group = token_group.Next;
          token_group.Expect("{");
          token_group = token_group.Next;
          return token_group.Until((token_group) => {
            const name = token_group.Text;
            token_group = token_group.Next;
            token_group.Expect(":");
            token_group = token_group.Next;
            let block: Block;
            [token_group, block] = Block.Parse(token_group).Destructured;

            return new TokenGroupResponse(token_group, [name, block] as const);
          }, "}");
        },
      },
      ({ subject, as, using }) =>
        new MatchExpression(
          token_group.CodeLocation,
          subject,
          as,
          using.reduce(
            (c, [name, block]) => ({ ...c, [name]: block }),
            {} as Record<string, Block>
          )
        )
    );
  },
});
