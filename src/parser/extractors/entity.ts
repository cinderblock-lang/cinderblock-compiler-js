import { TokenGroup } from "../token";
import {
  BuildWhile,
  BuildWhileOnStart,
  ExpectNext,
  IfIs,
  NextBlock,
} from "../utils";
import { ExtractFunctionParameter, ExtractProperty, ExtractType } from "./type";
import { ParserError } from "../error";
import { ExtractStatementBlock } from "./statement";
import { ExtractExpression } from "./expression";
import { ComponentGroup } from "../../ast/component-group";
import { Entity } from "../../ast/entity/base";
import { ExternalFunctionDeclaration } from "../../ast/entity/external-function-declaration";
import { FunctionEntity } from "../../ast/entity/function";
import { LibEntity } from "../../ast/entity/lib";
import { SchemaEntity } from "../../ast/entity/schema";
import { StructEntity } from "../../ast/entity/struct";
import { SystemEntity } from "../../ast/entity/system";
import { UsingEntity } from "../../ast/entity/using";
import { TestEntity } from "../../ast/entity/test";
import { EnumEntity } from "../../ast/entity/enum";

function ExtractExternalFunction(tokens: TokenGroup) {
  const start = ExpectNext(tokens, "fn");
  const name = NextBlock(tokens).Text;
  const parameters = BuildWhile(tokens, "(", ",", ")", () =>
    ExtractFunctionParameter(tokens)
  );
  ExpectNext(tokens, ":");
  const returns = ExtractType(tokens);
  ExpectNext(tokens, ";");

  return new ExternalFunctionDeclaration(
    start.CodeLocation,
    name,
    new ComponentGroup(...parameters),
    returns
  );
}

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

function ExtractLib(tokens: TokenGroup) {
  const path = ExtractExpression(tokens);

  const declarations = BuildWhile(tokens, "{", ";", "}", () =>
    ExtractExternalFunction(tokens)
  );

  return { path: path, declarations };
}

function ExtractSystem(tokens: TokenGroup) {
  const declarations = BuildWhile(tokens, "{", ";", "}", () =>
    ExtractExternalFunction(tokens)
  );

  return { declarations };
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
    case "lib": {
      const { path, declarations } = ExtractLib(tokens);
      return new LibEntity(
        current.CodeLocation,
        exported ?? false,
        path,
        new ComponentGroup(...declarations)
      );
    }
    case "system": {
      const { declarations } = ExtractSystem(tokens);
      return new SystemEntity(
        current.CodeLocation,
        exported ?? false,
        new ComponentGroup(...declarations)
      );
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
        "lib",
        "system",
        "export",
        "unsafe",
        "test",
        "enum"
      );
  }
}
