import { CodeLocation } from "../../location/code-location";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { WriterRawStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";
import { LinkedBlock } from "../block";
import { LinkedParameterCollection } from "../parameter-collection";
import { LinkedFunctionType } from "../type/function";
import { LinkedPrimitiveType } from "../type/primitive";
import { LinkedEntity } from "./base";
import { FunctionEntity } from "./function";

export class CFunction extends LinkedEntity {
  readonly #name: string;
  readonly #includes: Array<string>;
  readonly #parameters: LinkedParameterCollection;
  readonly #content: string;
  readonly #returns: LinkedPrimitiveType;

  constructor(
    ctx: CodeLocation,
    includes: Array<string>,
    name: string,
    parameters: LinkedParameterCollection,
    content: string,
    returns: LinkedPrimitiveType
  ) {
    super(ctx);

    this.#name = name;
    this.#includes = includes;
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
    for (const include of this.#includes) file = file.WithInclude(include);

    let parameters: Array<WriterProperty>;
    [file, parameters] = this.#parameters.Build(file, true);
    let returns: WriterType;
    [file, returns] = this.#returns.Build(file);

    let result = new WriterFunction(this.CName, parameters, returns, []);

    result = result.WithStatement(new WriterRawStatement(this.#content));
    return [file.WithEntity(result), result];
  }
}
