import { Expression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { ParserError } from "../../parser/error";
import { Scope } from "../../linker/closure";
import {
  WriterExpression,
  WriterGlobalReferenceExpression,
  WriterLiteralExpression,
  WriterReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { Type } from "../type/base";
import { PrimitiveType } from "../type/primitive";
import { WriterFunction, WriterString } from "../../writer/entity";
import { WriterType } from "../../writer/type";
import { Namer } from "../../location/namer";

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

  Build(
    file: WriterFile,
    func: WriterFunction,
    scope: Scope
  ): [WriterFile, WriterFunction, WriterExpression] {
    let type: WriterType;
    [file, type] = this.ResolvesTo(scope).Build(file, scope);

    switch (this.#type) {
      case "bool":
        return [
          file,
          func,
          new WriterLiteralExpression(this.#value === "true" ? "1" : "0"),
        ];
      case "char":
        return [file, func, new WriterLiteralExpression(`'${this.#value}'`)];
      case "double":
        return [
          file,
          func,
          new WriterLiteralExpression(this.#value.replace("d", "")),
        ];
      case "float":
        return [file, func, new WriterLiteralExpression(this.#value)];
      case "int":
        return [
          file,
          func,
          new WriterLiteralExpression(this.#value.replace("i", "")),
        ];
      case "long":
        return [file, func, new WriterLiteralExpression(this.#value)];
      case "string":
        const entity = new WriterString(this.CName, this.#value);
        return [
          file.WithEntity(entity),
          func,
          new WriterGlobalReferenceExpression(entity),
        ];
      case "null":
        return [file, func, new WriterLiteralExpression("NULL")];
    }
  }

  ResolvesTo(scope: Scope): Type {
    switch (this.#type) {
      case "string":
        return new PrimitiveType(this.CodeLocation, "string");
      case "int":
        return new PrimitiveType(this.CodeLocation, "int");
      case "char":
        return new PrimitiveType(this.CodeLocation, "char");
      case "float":
        return new PrimitiveType(this.CodeLocation, "float");
      case "double":
        return new PrimitiveType(this.CodeLocation, "double");
      case "long":
        return new PrimitiveType(this.CodeLocation, "long");
      case "bool":
        return new PrimitiveType(this.CodeLocation, "bool");
      case "null":
        return new PrimitiveType(this.CodeLocation, "null");
    }
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
