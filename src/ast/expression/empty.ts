import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { Type } from "../type/base";
import { ParserError } from "../../parser/error";

export class EmptyExpression extends Expression {
  readonly #of: Type;

  constructor(ctx: CodeLocation, of: Type) {
    super(ctx);
    this.#of = of;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "empty";
  },
  Extract(token_group, prefix) {
    const input_tokens = token_group.Next;
    const [output_tokens, subject] = Type.Parse(input_tokens);
    if (output_tokens.Text !== ")")
      throw new ParserError(output_tokens.CodeLocation, "Expected a ) token");

    return [
      output_tokens.Next,
      new EmptyExpression(token_group.CodeLocation, subject),
    ];
  },
});
