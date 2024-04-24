import { CodeLocation } from "../../location/code-location";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { WriterStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";
import { LinkedBlock } from "../block";
import { LinkedParameterCollection } from "../parameter-collection";
import { LinkedType } from "../type/base";
import { LinkedFunctionType } from "../type/function";
import { LinkedEntity } from "./base";

export class FunctionEntity extends LinkedEntity {
  readonly #parameters: LinkedParameterCollection;
  readonly #content: LinkedBlock;
  readonly #returns: LinkedType;

  constructor(
    ctx: CodeLocation,
    name: string,
    parameters: LinkedParameterCollection,
    content: LinkedBlock,
    returns: LinkedType
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
  }

  get Type() {
    return new LinkedFunctionType(
      this.CodeLocation,
      this.#parameters,
      this.#returns
    );
  }

  Declare(file: WriterFile): [WriterFile, WriterFunction] {
    let parameters: Array<WriterProperty>;
    [file, parameters] = this.#parameters.Build(file);
    let returns: WriterType;
    [file, returns] = this.#returns.Build(file);

    let result = new WriterFunction(this.CName, parameters, returns, []);

    let statements: Array<WriterStatement>;
    [file, result, statements] = this.#content.Build(file, result);
    result = result.WithStatements(statements);
    return [file.WithEntity(result), result];
  }
}
