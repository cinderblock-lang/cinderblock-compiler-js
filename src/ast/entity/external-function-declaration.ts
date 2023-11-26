import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { Type } from "../type/base";
import { FunctionType } from "../type/function";
import { WriterContext } from "../writer";

export class ExternalFunctionDeclaration extends Component {
  readonly #name: string;
  readonly #parameters: ComponentGroup;
  readonly #returns: Component;

  constructor(
    ctx: CodeLocation,
    name: string,
    parameters: ComponentGroup,
    returns: Type
  ) {
    super(ctx);
    this.#name = name;
    this.#parameters = parameters;
    this.#returns = returns;
  }

  get Name() {
    return this.#name;
  }

  get Returns() {
    return this.#returns;
  }

  get Parameters() {
    return this.#parameters;
  }

  get type_name() {
    return "external_function_declaration";
  }

  c(ctx: WriterContext): string {
    console.warn(
      "Currently, external functions are not supported and will be ignored"
    );
    return ``;
  }

  resolve_type(ctx: WriterContext): Component {
    return new FunctionType(this.CodeLocation, this.Parameters, this.Returns);
  }
}
