import { CodeLocation } from "../../location/code-location";
import { WriterProperty } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { WriterFunctionType, WriterType } from "../../writer/type";
import { LinkedExpression } from "../expression/base";
import { LinkedParameter } from "../parameter";
import { LinkedParameterCollection } from "../parameter-collection";
import { LinkedType } from "./base";

export class LinkedFunctionType extends LinkedType {
  readonly #parameters: LinkedParameterCollection;
  readonly #returns: LinkedType;

  constructor(
    ctx: CodeLocation,
    parameters: LinkedParameterCollection,
    returns: LinkedType
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns;
  }

  IsPartial(parameters: Array<LinkedExpression>) {
    return this.Remaining(parameters).filter((p) => !p.Optional).length > 0;
  }

  Remaining(parameters: Array<LinkedExpression>): Array<LinkedParameter> {
    return this.#parameters.Remaining(parameters.length);
  }

  get Returns() {
    return this.#returns;
  }

  Build(file: WriterFile): [WriterFile, WriterType] {
    let parameters: Array<WriterProperty>;
    let returns: WriterType;
    [file, parameters] = this.#parameters.Build(file);
    [file, returns] = this.#returns.Build(file);
    return [file, new WriterFunctionType(parameters, returns)];
  }
}
