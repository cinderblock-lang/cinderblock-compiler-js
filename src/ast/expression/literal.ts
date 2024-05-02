import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Context } from "../context";
import { LinkedLiteralExpression } from "../../linked-ast/expression/literal";

export type LiteralType =
  | "string"
  | "int"
  | "char"
  | "float"
  | "double"
  | "long"
  | "bool"
  | "null";

export class LiteralExpression extends Expression {
  readonly #type: LiteralType;
  readonly #value: string;

  constructor(ctx: CodeLocation, type: LiteralType, value: string) {
    super(ctx);
    this.#type = type;
    this.#value = value;
  }

  Linked(context: Context) {
    return context.Build(
      {},
      () =>
        new LinkedLiteralExpression(this.CodeLocation, this.#type, this.#value)
    );
  }
}

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "true" || token_group.Text === "false";
  },
  Extract(token_group, prefix) {
    return [
      token_group.Next,
      new LiteralExpression(token_group.CodeLocation, "bool", token_group.Text),
    ];
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "null";
  },
  Extract(token_group, prefix) {
    return [
      token_group.Next,
      new LiteralExpression(token_group.CodeLocation, "null", token_group.Text),
    ];
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return !!token_group.Text.match(/^[0-9]+i$/gm);
  },
  Extract(token_group, prefix) {
    return [
      token_group.Next,
      new LiteralExpression(token_group.CodeLocation, "int", token_group.Text),
    ];
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return !!token_group.Text.match(/^0b[0-9]+$/gm);
  },
  Extract(token_group, prefix) {
    return [
      token_group.Next,
      new LiteralExpression(token_group.CodeLocation, "int", token_group.Text),
    ];
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return !!token_group.Text.match(/^[0-9]+$/gm);
  },
  Extract(token_group, prefix) {
    const start = token_group.Text;
    token_group.Next.Expect(".");

    const after_dot = token_group.Skip(2);
    if (after_dot.Text.match(/^[0-9]+f$/gm))
      return [
        after_dot.Next,
        new LiteralExpression(
          token_group.CodeLocation,
          "float",
          start + "." + after_dot.Text
        ),
      ];
    if (after_dot.Text.match(/^[0-9]+d$/gm))
      return [
        after_dot.Next,
        new LiteralExpression(
          token_group.CodeLocation,
          "double",
          start + "." + after_dot.Text
        ),
      ];

    throw new ParserError(
      token_group.CodeLocation,
      "Could not parse float. Remember to put a suffix for integral types."
    );
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text.startsWith('"') && token_group.Text.endsWith('"');
  },
  Extract(token_group, prefix) {
    return [
      token_group.Next,
      new LiteralExpression(
        token_group.CodeLocation,
        "string",
        token_group.Text
      ),
    ];
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text.startsWith("'") && token_group.Text.endsWith("'");
  },
  Extract(token_group, prefix) {
    return [
      token_group.Next,
      new LiteralExpression(token_group.CodeLocation, "char", token_group.Text),
    ];
  },
});
