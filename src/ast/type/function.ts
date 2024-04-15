import { IConcreteType, Scope } from "../../linker/closure";
import { CodeLocation } from "../../location/code-location";
import { WriterProperty } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { WriterFunctionType, WriterType } from "../../writer/type";
import { ParameterCollection } from "../parameter-collection";
import { Type } from "./base";

export class FunctionType extends Type implements IConcreteType {
  readonly #parameters: ParameterCollection;
  readonly #returns: Type;

  constructor(
    ctx: CodeLocation,
    parameters: ParameterCollection,
    returns: Type
  ) {
    super(ctx);
    this.#parameters = parameters;
    this.#returns = returns;
  }

  get TypeName(): string {
    return "void*";
  }

  get Parameters() {
    return this.#parameters;
  }

  get Returns() {
    return this.#returns;
  }

  Build(file: WriterFile, scope: Scope): [WriterFile, WriterType] {
    let parameters: Array<WriterProperty>;
    let returns: WriterType;
    [file, parameters] = this.#parameters.Build(file, scope);
    [file, returns] = this.#returns.Build(file, scope);
    return [file, new WriterFunctionType(parameters, returns)];
  }

  ResolveConcrete(scope: Scope): IConcreteType {
    return this;
  }
}

Type.Register({
  Priority: 1,
  Is(token_group) {
    return token_group.Text === "(";
  },
  Extract(token_group) {
    token_group.Expect("(");
    const [after_parameters, parameters] = ParameterCollection.Parse(
      token_group.Next
    );

    after_parameters.Expect("->");

    const [after_returns, returns] = Type.Parse(after_parameters.Next);

    return [
      after_returns,
      new FunctionType(token_group.CodeLocation, parameters, returns),
    ];
  },
});
