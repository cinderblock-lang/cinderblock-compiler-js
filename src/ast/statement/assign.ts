import { LinkedAssignStatement } from "../../linked-ast/statement/assign";
import { LinkedStructType } from "../../linked-ast/type/struct";
import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Context } from "../context";
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

  Linked(context: Context) {
    return context.Build(
      {
        equals: (c) => this.#equals.Linked(c),
      },
      ({ equals }) => {
        const make = context.GetMake();
        if (!make)
          throw new LinkerError(
            this.CodeLocation,
            "error",
            "Cannot assign here"
          );

        const type = make.Type;
        if (!(type instanceof LinkedStructType))
          throw new LinkerError(
            this.CodeLocation,
            "error",
            "May only make a struct"
          );

        const property = type.GetKey(this.#name);
        if (!property)
          throw new LinkerError(
            this.CodeLocation,
            "error",
            "Property not found"
          );

        return new LinkedAssignStatement(
          this.CodeLocation,
          property,
          equals,
          make
        );
      }
    );
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
