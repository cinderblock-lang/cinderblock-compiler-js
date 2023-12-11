import { TokenGroup } from "../token";
import {
  BuildWhile,
  BuildWhileOnStart,
  IfIs,
  NextBlock,
} from "../utils";
import { ExtractFunctionParameter, ExtractProperty, ExtractType } from "./type";
import { ParserError } from "../error";
import { ExtractStatementBlock } from "./statement";
import { ComponentGroup } from "../../ast/component-group";
import { Entity } from "../../ast/entity/base";
import { FunctionEntity } from "../../ast/entity/function";
import { SchemaEntity } from "../../ast/entity/schema";
import { StructEntity } from "../../ast/entity/struct";
import { UsingEntity } from "../../ast/entity/using";
import { TestEntity } from "../../ast/entity/test";
import { EnumEntity } from "../../ast/entity/enum";

function ExtractFunction(tokens: TokenGroup) {
  const name = NextBlock(tokens).Text;
  const parameters = BuildWhile(tokens, "(", ",", ")", () =>
    ExtractFunctionParameter(tokens)
  );
  const returns = IfIs(tokens, ":", () => ExtractType(tokens));

  return { name, parameters, returns, body: ExtractStatementBlock(tokens) };
}

function ExtractTest(tokens: TokenGroup) {
  const name_token = NextBlock(tokens);
  const name = name_token.Text;

  if (!name.startsWith('"') || !name.endsWith('"'))
    throw new ParserError(
      name_token.CodeLocation,
      "Tests must have a string as the name"
    );

  return { name: name.replace(/"/gm, ""), body: ExtractStatementBlock(tokens) };
}

function ExtractSchemaOrStruct(tokens: TokenGroup) {
  const name = NextBlock(tokens).Text;

  const properties = BuildWhile(tokens, "{", ";", "}", () =>
    ExtractProperty(tokens)
  );

  return { name, properties };
}

function ExtractUsing(tokens: TokenGroup) {
  return BuildWhileOnStart(tokens, ".", ";", () => NextBlock(tokens).Text).join(
    "."
  );
}

export function ExtractEntity(
  tokens: TokenGroup,
  namespace: string,
  using: Array<string>,
  exported?: boolean,
  unsafe?: boolean
): Entity {
  const current = NextBlock(tokens);

  switch (current.Text) {
    case "schema": {
      const { name, properties } = ExtractSchemaOrStruct(tokens);
      return new SchemaEntity(
        current.CodeLocation,
        exported ?? false,
        name,
        new ComponentGroup(...properties)
      );
    }
    case "struct": {
      const { name, properties } = ExtractSchemaOrStruct(tokens);
      return new StructEntity(
        current.CodeLocation,
        exported ?? false,
        name,
        new ComponentGroup(...properties),
        namespace,
        using
      );
    }
    case "enum": {
      const { name, properties } = ExtractSchemaOrStruct(tokens);
      return new EnumEntity(
        current.CodeLocation,
        exported ?? false,
        name,
        new ComponentGroup(...properties),
        namespace,
        using
      );
    }
    case "using": {
      const name = ExtractUsing(tokens);
      using.push(name);
      return new UsingEntity(current.CodeLocation, false, name);
    }
    case "export": {
      return ExtractEntity(tokens, namespace, using, true);
    }
    case "fn": {
      const { name, parameters, returns, body } = ExtractFunction(tokens);
      return new FunctionEntity(
        current.CodeLocation,
        exported ?? false,
        name,
        unsafe ?? false,
        new ComponentGroup(...parameters),
        body,
        returns,
        namespace,
        using
      );
    }
    case "unsafe": {
      return ExtractEntity(tokens, namespace, using, exported, true);
    }
    case "test": {
      const { name, body } = ExtractTest(tokens);
      return new TestEntity(
        current.CodeLocation,
        false,
        name,
        body,
        namespace,
        using
      );
    }
    default:
      throw ParserError.UnexpectedSymbol(
        current,
        "schema",
        "struct",
        "fn",
        "using",
        "export",
        "unsafe",
        "test",
        "enum"
      );
  }
}
