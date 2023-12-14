import { Component } from "../../ast/component";
import { ComponentGroup } from "../../ast/component-group";
import { AccessExpression } from "../../ast/expression/access";
import { Expression } from "../../ast/expression/base";
import { BracketsExpression } from "../../ast/expression/brackets";
import { EmptyExpression } from "../../ast/expression/empty";
import { IfExpression } from "../../ast/expression/if";
import { InvokationExpression } from "../../ast/expression/invokation";
import { IsExpression } from "../../ast/expression/is";
import { IterateExpression } from "../../ast/expression/iterate";
import { LambdaExpression } from "../../ast/expression/lambda";
import { LiteralExpression } from "../../ast/expression/literal";
import { MakeExpression } from "../../ast/expression/make";
import { MatchExpression } from "../../ast/expression/match";
import {
  Operator,
  Operators,
  OperatorExpression,
} from "../../ast/expression/operator";
import { PickExpression } from "../../ast/expression/pick";
import { ReferenceExpression } from "../../ast/expression/reference";
import { SystemExpression } from "../../ast/expression/system";
import { ReturnStatement } from "../../ast/statement/return";
import { EmptyCodeLocation } from "../../location/empty";
import { ParserError } from "../error";
import { TokenGroup } from "../token";
import { BuildWhile, BuildWhileOnStart, ExpectNext, NextBlock } from "../utils";
import { ExtractStatementBlock } from "./statement";
import { ExtractFunctionParameter, ExtractType } from "./type";

function IsOperator(item: string | undefined): item is Operator {
  return Operators.includes((item ?? "") as Operator);
}

function ExtractIf(tokens: TokenGroup) {
  ExpectNext(tokens, "(");
  const check = ExtractExpression(tokens, [")"]);
  ExpectNext(tokens, ")");
  const if_block =
    tokens.peek()?.Text === "{"
      ? ExtractStatementBlock(tokens)
      : new ComponentGroup(
          new ReturnStatement(
            EmptyCodeLocation,
            ExtractExpression(tokens, [";"])
          )
        );
  ExpectNext(tokens, "else");
  const else_block =
    tokens.peek()?.Text === "{"
      ? ExtractStatementBlock(tokens)
      : new ComponentGroup(
          new ReturnStatement(
            EmptyCodeLocation,
            ExtractExpression(tokens, [";"])
          )
        );

  return { check, if_block, else_block };
}

function ExtractEmpty(tokens: TokenGroup) {
  ExpectNext(tokens, "(");
  const of = ExtractType(tokens);
  ExpectNext(tokens, ")");

  return { of };
}

function ExtractIterate(tokens: TokenGroup) {
  ExpectNext(tokens, "(");
  const to = ExtractExpression(tokens, ["as"]);
  ExpectNext(tokens, "as");
  const as = NextBlock(tokens).Text;
  ExpectNext(tokens, ")");

  const block = ExtractStatementBlock(tokens);

  return { to, as, block };
}

function ExtractMake(tokens: TokenGroup) {
  const name = NextBlock(tokens).Text;

  const block = ExtractStatementBlock(tokens);

  return { name, block };
}

function ExtractPick(tokens: TokenGroup) {
  const enum_name = NextBlock(tokens);
  ExpectNext(tokens, ".");
  const enum_key = NextBlock(tokens);

  const block = ExtractStatementBlock(tokens);
  return { name: enum_name.Text, key: enum_key.Text, block };
}

function ExtractMatch(tokens: TokenGroup) {
  ExpectNext(tokens, "(");
  const subject = ExtractExpression(tokens, ["as"]);
  ExpectNext(tokens, "as");
  const as = NextBlock(tokens);
  ExpectNext(tokens, ")");
  const matchers = BuildWhile(tokens, "{", ",", "}", () => {
    const name = NextBlock(tokens);
    ExpectNext(tokens, ":");
    const block = ExtractStatementBlock(tokens);

    return { name, block };
  });

  return { subject, as: as.Text, matchers };
}

function ExtractLambda(tokens: TokenGroup, look_for: Array<string>) {
  const parameters = BuildWhile(tokens, "(", ",", ")", () =>
    ExtractFunctionParameter(tokens)
  );

  let returns: Component | undefined = undefined;
  if (tokens.peek()?.Text === ":") {
    ExpectNext(tokens, ":");
    returns = ExtractType(tokens);
  }

  ExpectNext(tokens, "->");

  if (tokens.peek()?.Text === "{") {
    const body = ExtractStatementBlock(tokens);

    return { parameters, body, returns };
  }

  const body = new ComponentGroup(
    new ReturnStatement(
      tokens.peek()?.CodeLocation ?? parameters[0].CodeLocation,
      ExtractExpression(tokens, look_for)
    )
  );

  return {
    parameters,
    body,
  };
}

export function ExtractExpression(
  tokens: TokenGroup,
  look_for = [";"]
): Expression {
  let result: Expression | undefined;
  while (!look_for.includes(tokens.peek()?.Text ?? "")) {
    const current = NextBlock(tokens);
    const text = current.Text;

    if (text === "(" && !result) {
      const input = ExtractExpression(tokens, [")"]);
      ExpectNext(tokens, ")");
      result = new BracketsExpression(current.CodeLocation, input);
    } else if (IsOperator(text)) {
      if (!result)
        throw new ParserError(
          current.CodeLocation,
          "Operators must have a left hand side"
        );
      result = new OperatorExpression(
        current.CodeLocation,
        result,
        text,
        ExtractExpression(tokens, look_for)
      );
    } else if (text === "if") {
      const { check, if_block, else_block } = ExtractIf(tokens);
      result = new IfExpression(
        current.CodeLocation,
        check,
        if_block,
        else_block
      );
    } else if (text === "empty") {
      const { of } = ExtractEmpty(tokens);
      result = new EmptyExpression(current.CodeLocation, of);
    } else if (text === "true" || text === "false") {
      result = new LiteralExpression(current.CodeLocation, "bool", text);
    } else if (text === "iterate") {
      const { to, as, block } = ExtractIterate(tokens);
      result = new IterateExpression(current.CodeLocation, to, as, block);
    } else if (text === "make") {
      const { name, block } = ExtractMake(tokens);
      result = new MakeExpression(current.CodeLocation, name, block);
    } else if (text === "pick") {
      const { name, key, block } = ExtractPick(tokens);
      result = new PickExpression(current.CodeLocation, name, key, block);
    } else if (text === "match") {
      const { subject, as, matchers } = ExtractMatch(tokens);
      result = new MatchExpression(
        current.CodeLocation,
        subject,
        as,
        matchers.reduce(
          (c, n) => ({ ...c, [n.name.Text]: n.block }),
          {} as Record<string, ComponentGroup>
        )
      );
    } else if (text === "is") {
      if (!result)
        throw new ParserError(
          current.CodeLocation,
          "Is checks must have a left hand side"
        );

      const right = ExtractType(tokens);
      result = new IsExpression(current.CodeLocation, result, right);
    } else if (text === "fn") {
      const { parameters, body, returns } = ExtractLambda(tokens, look_for);
      result = new LambdaExpression(
        current.CodeLocation,
        new ComponentGroup(...parameters),
        body,
        returns
      );
    } else if (text === "system") {
      ExpectNext(tokens, "(");
      const parameters =
        tokens.peek()?.Text !== ")"
          ? BuildWhileOnStart(tokens, ",", ")", () =>
              tokens.peek()?.Text === "out"
                ? ExtractFunctionParameter(tokens)
                : ExtractExpression(tokens, [",", ")"])
            )
          : tokens.next() && [];

      let length: Expression = new LiteralExpression(EmptyCodeLocation, "int", "0i");

      if (tokens.peek()?.Text === "[") {
        ExpectNext(tokens, "[");
        length = ExtractExpression(tokens, ["]"]);
        ExpectNext(tokens, "]");
      }

      result = new SystemExpression(
        current.CodeLocation,
        new ComponentGroup(...parameters),
        length
      );
    } else if (text === "(") {
      if (!result)
        throw new ParserError(
          current.CodeLocation,
          "Attempting an invokation without a referenced function"
        );

      const parameters =
        tokens.peek()?.Text !== ")"
          ? BuildWhileOnStart(tokens, ",", ")", () =>
              ExtractExpression(tokens, [",", ")"])
            )
          : tokens.next() && [];

      result = new InvokationExpression(
        current.CodeLocation,
        result,
        new ComponentGroup(...parameters)
      );
    } else if (text === ".") {
      if (!result)
        throw new ParserError(
          current.CodeLocation,
          "Attempting an access without a left hand side"
        );
      const accessed = NextBlock(tokens);
      result = new AccessExpression(
        current.CodeLocation,
        result,
        accessed.Text
      );
    } else if (text.match(/^[0-9]+i$/gm)) {
      result = new LiteralExpression(current.CodeLocation, "int", text);
    } else if (text.match(/^0b[0-9]+$/gm)) {
      result = new LiteralExpression(current.CodeLocation, "int", text);
    } else if (text.match(/^[0-9]+$/gm)) {
      ExpectNext(tokens, ".");
      const next = NextBlock(tokens);
      if (next.Text.match(/^[0-9]+f$/gm)) {
        result = new LiteralExpression(
          current.CodeLocation,
          "float",
          text + "." + next.Text
        );
      } else if (next.Text.match(/^[0-9]+d$/gm)) {
        result = new LiteralExpression(
          current.CodeLocation,
          "double",
          text + "." + next.Text
        );
      } else {
        throw new ParserError(
          current.CodeLocation,
          "Floating values must be a float or a double"
        );
      }
    } else if (text.startsWith('"')) {
      if (!text.endsWith('"'))
        throw new ParserError(current.CodeLocation, "Expected end of string");
      result = new LiteralExpression(
        current.CodeLocation,
        "string",
        text.substring(1, text.length - 1)
      );
    } else if (text.startsWith("'")) {
      if (!text.endsWith("'"))
        throw new ParserError(current.CodeLocation, "Expected end of string");
      if (text.length !== 3)
        throw new ParserError(
          current.CodeLocation,
          "Chars may have an exact length of 1"
        );
      result = new LiteralExpression(
        current.CodeLocation,
        "char",
        text.substring(1, text.length - 1)
      );
    } else {
      result = new ReferenceExpression(current.CodeLocation, current.Text);
    }
  }

  if (!result)
    throw new ParserError(tokens.peek()?.CodeLocation, "No Expression found");

  return result;
}
