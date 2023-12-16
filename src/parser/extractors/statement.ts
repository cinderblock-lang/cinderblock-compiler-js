import { ComponentGroup } from "../../ast/component-group";
import { AssignStatement } from "../../ast/statement/assign";
import { Statement } from "../../ast/statement/base";
import { PanicStatement } from "../../ast/statement/panic";
import { ReturnStatement } from "../../ast/statement/return";
import { SideStatement } from "../../ast/statement/side";
import { SubStatement } from "../../ast/statement/sub";
import { TokenGroup } from "../token";
import { BuildWhile, ExpectNext, NextBlock } from "../utils";
import { ExtractExpression } from "./expression";

function ExtractSub(tokens: TokenGroup) {
  ExpectNext(tokens, "->");

  return { equals: ExtractExpression(tokens) };
}

function ExtractAssign(tokens: TokenGroup) {
  const name = NextBlock(tokens).Text;
  ExpectNext(tokens, "=");

  return { name, equals: ExtractExpression(tokens) };
}

function ExtractReturn(tokens: TokenGroup) {
  return ExtractExpression(tokens);
}

function ExtractSide(tokens: TokenGroup) {
  return ExtractExpression(tokens);
}

function ExtractPanic(tokens: TokenGroup) {
  return { error: ExtractExpression(tokens) };
}

export function ExtractStatement(tokens: TokenGroup): Statement {
  const current = NextBlock(tokens);

  switch (current.Text) {
    case "return": {
      return new ReturnStatement(current.CodeLocation, ExtractReturn(tokens));
    }
    case "assign": {
      const { name, equals } = ExtractAssign(tokens);
      return new AssignStatement(current.CodeLocation, name, equals);
    }
    case "panic": {
      const { error } = ExtractPanic(tokens);
      return new PanicStatement(current.CodeLocation, error);
    }
    case "side": {
      return new SideStatement(current.CodeLocation, ExtractSide(tokens));
    }
    default:
      const { equals } = ExtractSub(tokens);
      return new SubStatement(current.CodeLocation, current.Text, equals);
  }
}

export function ExtractStatementBlock(tokens: TokenGroup): ComponentGroup {
  return new ComponentGroup(
    ...BuildWhile(tokens, "{", ";", "}", () => ExtractStatement(tokens))
  );
}
