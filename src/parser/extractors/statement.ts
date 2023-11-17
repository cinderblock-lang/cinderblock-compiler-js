import {
  AsmProperty,
  AsmStatement,
  AssignStatement,
  ComponentGroup,
  PanicStatement,
  ReturnStatement,
  Statement,
  StoreStatement,
} from "#compiler/ast";
import { ParserError } from "../error";
import { TokenGroup } from "../token";
import { BuildWhile, ExpectNext, NextBlock } from "../utils";
import { ExtractExpression } from "./expression";

function ExtractStore(tokens: TokenGroup) {
  const name = NextBlock(tokens).Text;
  ExpectNext(tokens, "=");

  return { name, equals: ExtractExpression(tokens) };
}

function ExtractAssign(tokens: TokenGroup) {
  const name = NextBlock(tokens).Text;
  ExpectNext(tokens, "=");

  return { name, equals: ExtractExpression(tokens) };
}

function ExtractReturn(tokens: TokenGroup) {
  return ExtractExpression(tokens);
}

function ExtractPanic(tokens: TokenGroup) {
  return { error: ExtractExpression(tokens) };
}

function ExtractAsm(tokens: TokenGroup) {
  const inputs = BuildWhile(tokens, "(", ",", ")", () => {
    const name = NextBlock(tokens);
    ExpectNext(tokens, ":");
    const value = ExtractExpression(tokens, [",", ")"]);
    return new AsmProperty(name.Location, name.Text, value);
  });

  ExpectNext(tokens, ":");

  const output = NextBlock(tokens).Text;

  ExpectNext(tokens, "as");
  const output_as = NextBlock(tokens).Text;

  const body = NextBlock(tokens);
  if (!body.Text.startsWith("`") || !body.Text.endsWith("`"))
    throw new ParserError(
      body.Location,
      "asm statements must be followed by a multi line string"
    );

  return { inputs, output, output_as, body: body.Text.replace(/`/gm, "") };
}

export function ExtractStatement(tokens: TokenGroup): Statement {
  const current = NextBlock(tokens);

  switch (current.Text) {
    case "store": {
      const { name, equals } = ExtractStore(tokens);
      return new StoreStatement(current.Location, name, equals);
    }
    case "return": {
      return new ReturnStatement(current.Location, ExtractReturn(tokens));
    }
    case "assign": {
      const { name, equals } = ExtractAssign(tokens);
      return new AssignStatement(current.Location, name, equals);
    }
    case "panic": {
      const { error } = ExtractPanic(tokens);
      return new PanicStatement(current.Location, error);
    }
    case "asm": {
      const { inputs, output, output_as, body } = ExtractAsm(tokens);
      return new AsmStatement(
        current.Location,
        body,
        output,
        output_as,
        new ComponentGroup(...inputs)
      );
    }
    default:
      throw ParserError.UnexpectedSymbol(
        current,
        "store",
        "return",
        "assign",
        "panic",
        "asm"
      );
  }
}

export function ExtractStatementBlock(tokens: TokenGroup): ComponentGroup {
  return new ComponentGroup(
    ...BuildWhile(tokens, "{", ";", "}", () => ExtractStatement(tokens))
  );
}
