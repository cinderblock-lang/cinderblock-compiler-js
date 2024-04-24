import { LinkedExpression } from "./base";
import { CodeLocation } from "../../location/code-location";
import { LinkedType } from "../type/base";
import { LinkedBlock } from "../block";
import { LinkedParameterCollection } from "../parameter-collection";
import { WriterFunction, WriterProperty } from "../../writer/entity";
import {
  WriterExpression,
  WriterGlobalReferenceExpression,
} from "../../writer/expression";
import { WriterFile } from "../../writer/file";
import { WriterStatement } from "../../writer/statement";
import { WriterType } from "../../writer/type";

export class LambdaExpression extends LinkedExpression {
  readonly #parameters: LinkedParameterCollection;
  readonly #body: LinkedBlock;
  readonly #returns: LinkedType;

  constructor(
    ctx: CodeLocation,
    parameters: LinkedParameterCollection,
    body: LinkedBlock,
    returns: LinkedType
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#body = body;
    this.#returns = returns;
  }

  get Type() {
    return this.#returns;
  }

  Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterExpression] {
    let parameters: Array<WriterProperty>;
    [file, parameters] = this.#parameters.Build(file);

    let type: WriterType;
    [file, type] = this.#returns.Build(file);

    let main_func = new WriterFunction(this.CName, parameters, type, [], func);
    let main_statements: Array<WriterStatement>;
    [file, main_func, main_statements] = this.#body.Build(file, main_func);

    main_func = main_func.WithStatements(main_statements);
    file = file.WithEntity(main_func);

    return [file, func, new WriterGlobalReferenceExpression(main_func)];
  }
}
