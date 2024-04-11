import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { Namer } from "../../location/namer";
import { ParserError } from "../../parser/error";

export class IterateExpression extends Expression {
  readonly #over: Component;
  readonly #as: string;
  readonly #using: ComponentGroup;
  readonly #struct_name: string;

  constructor(
    ctx: CodeLocation,
    over: Expression,
    as: string,
    using: ComponentGroup
  ) {
    super(ctx);
    this.#over = over;
    this.#as = as;
    this.#using = using;
    this.#struct_name = Namer.GetName();
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "iterate";
  },
  Extract(token_group, prefix) {
    token_group.Next.Expect("[");
    const [after_subject, subject] = Expression.Parse(token_group.Next.Next, [
      "]",
    ]);

    after_subject.Next.Expect("(");

    const item_name = after_subject.Skip(2).Text;
    after_subject.Skip(3).Expect(")");
    after_subject.Skip(4).Expect("->");

    const [after_body, body] = ComponentGroup.ParseOptionalExpression(
      after_subject.Skip(5)
    );

    return [
      after_body,
      new IterateExpression(token_group.CodeLocation, subject, item_name, body),
    ];
  },
});
