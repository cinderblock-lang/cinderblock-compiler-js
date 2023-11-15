import {
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
    default:
      throw ParserError.UnexpectedSymbol(
        current,
        "store",
        "return",
        "assign",
        "panic"
      );
  }
}

export function ExtractStatementBlock(tokens: TokenGroup): ComponentGroup {
  return new ComponentGroup(
    ...BuildWhile(tokens, "{", ";", "}", () => ExtractStatement(tokens))
  );
}
