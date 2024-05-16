import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Context } from "../context";
import { LinkedLiteralExpression } from "../../linked-ast/expression/literal";
import { TokenGroupResponse } from "../../parser/token-group-response";

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
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
      },
      ({ name }) =>
        new LiteralExpression(token_group.CodeLocation, "bool", name)
    );
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "null";
  },
  Extract(token_group, prefix) {
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
      },
      ({ name }) =>
        new LiteralExpression(token_group.CodeLocation, "null", name)
    );
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return !!token_group.Text.match(/^[0-9]+i$/gm);
  },
  Extract(token_group, prefix) {
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
      },
      ({ name }) => new LiteralExpression(token_group.CodeLocation, "int", name)
    );
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return !!token_group.Text.match(/^0b[0-9]+$/gm);
  },
  Extract(token_group, prefix) {
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
      },
      ({ name }) => new LiteralExpression(token_group.CodeLocation, "int", name)
    );
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return !!token_group.Text.match(/^[0-9]+$/gm);
  },
  Extract(token_group, prefix) {
    return token_group.Build(
      {
        name: (token_group) => {
          const start = token_group.Text;
          token_group = token_group.Next;
          token_group.Expect(".");
          token_group = token_group.Next;
          return new TokenGroupResponse(
            token_group.Next,
            [start, token_group.Text].join(".")
          );
        },
      },
      ({ name }) => {
        if (name.endsWith("f"))
          return new LiteralExpression(token_group.CodeLocation, "float", name);
        else if (name.endsWith("d"))
          return new LiteralExpression(token_group.CodeLocation, "float", name);

        throw new ParserError(
          token_group.CodeLocation,
          "Could not parse float. Remember to put a suffix for integral types."
        );
      }
    );
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text.startsWith('"') && token_group.Text.endsWith('"');
  },
  Extract(token_group, prefix) {
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
      },
      ({ name }) =>
        new LiteralExpression(token_group.CodeLocation, "string", name)
    );
  },
});

Expression.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text.startsWith("'") && token_group.Text.endsWith("'");
  },
  Extract(token_group, prefix) {
    return token_group.Build(
      {
        name: (token_group) => TokenGroupResponse.TextItem(token_group),
      },
      ({ name }) =>
        new LiteralExpression(token_group.CodeLocation, "char", name)
    );
  },
});
