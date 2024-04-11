import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Type } from "../type/base";
import { Expression } from "./base";

export class DefaultExpression extends Expression {
  readonly #subject: Type;

  constructor(ctx: CodeLocation, subject: Type) {
    super(ctx);
    this.#subject = subject;
  }
}

Expression.Register({
  Priority: 3,
  Is(token_group, prefix) {
    return token_group.Text === "default";
  },
  Extract(token_group, prefix) {
    const input_tokens = token_group.Next;
    const [output_tokens, subject] = Type.Parse(input_tokens);
    if (output_tokens.Text !== ")")
      throw new ParserError(output_tokens.CodeLocation, "Expected a ) token");

    return [
      output_tokens.Next,
      new DefaultExpression(token_group.CodeLocation, subject),
    ];
  },
});
