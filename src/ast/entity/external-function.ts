import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { FunctionEntity } from "./function";

export class ExternalFunctionEntity extends FunctionEntity {
  readonly #c_name: string;

  constructor(
    ctx: CodeLocation,
    name: string,
    parameters: ComponentGroup,
    c_name: string,
    returns: Component | undefined,
    namespace: string
  ) {
    super(
      ctx,
      true,
      name,
      true,
      parameters,
      new ComponentGroup(),
      returns,
      namespace,
      []
    );

    this.#c_name = c_name;
  }

  c(ctx_old: WriterContext, is_main = false): string {
    return this.#c_name;
  }
}
