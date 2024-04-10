import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { FunctionEntity } from "./function";

export class ExternalFunctionEntity extends FunctionEntity {
  readonly #c_name: string;
  readonly #file_contents: string;
  readonly #file_path: string;

  constructor(
    ctx: CodeLocation,
    name: string,
    parameters: ComponentGroup,
    c_name: string,
    file_contents: string,
    file_path: string,
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
    this.#file_contents = file_contents;
    this.#file_path = file_path;
  }
}
