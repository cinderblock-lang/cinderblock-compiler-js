import {
  ComponentGroup,
  Entity,
  ExternalFunctionDeclaration,
  FunctionEntity,
  LibEntity,
  SchemaEntity,
  StructEntity,
  SystemEntity,
  UsingEntity,
} from "#compiler/ast";
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
    start.Location,
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

export function ExtractEntity(tokens: TokenGroup, exported?: boolean): Entity {
  const current = NextBlock(tokens);

  switch (current.Text) {
    case "schema": {
      const { name, properties } = ExtractSchemaOrStruct(tokens);
      return new SchemaEntity(
        current.Location,
        exported ?? false,
        name,
        new ComponentGroup(...properties)
      );
    }
    case "struct": {
      const { name, properties } = ExtractSchemaOrStruct(tokens);
      return new StructEntity(
        current.Location,
        exported ?? false,
        name,
        new ComponentGroup(...properties)
      );
    }
    case "using": {
      return new UsingEntity(current.Location, false, ExtractUsing(tokens));
    }
    case "export": {
      return ExtractEntity(tokens, true);
    }
    case "lib": {
      const { path, declarations } = ExtractLib(tokens);
      return new LibEntity(
        current.Location,
        exported ?? false,
        path,
        new ComponentGroup(...declarations)
      );
    }
    case "system": {
      const { declarations } = ExtractSystem(tokens);
      return new SystemEntity(
        current.Location,
        exported ?? false,
        new ComponentGroup(...declarations)
      );
    }
    case "fn": {
      const { name, parameters, returns, body } = ExtractFunction(tokens);
      return new FunctionEntity(
        current.Location,
        exported ?? false,
        name,
        new ComponentGroup(...parameters),
        returns,
        body
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
        "export"
      );
  }
}
