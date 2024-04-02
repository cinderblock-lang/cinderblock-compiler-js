import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { FunctionEntity } from "./function";

export class ExternalFunctionEntity extends FunctionEntity {
  readonly #c_name: string;
  readonly #file_contents: string;
  readonly #file_path: string;

  static readonly #added: Array<string> = [];

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

  c(ctx: WriterContext, is_main = false): string {
    if (!ExternalFunctionEntity.#added.includes(this.#file_path)) {
      ctx.AddGlobal(this.#file_contents.replace(/#include [^;]+\n/gm, ""));

      for (const match of this.#file_contents.matchAll(/#include ([^;])+\n/gm)) {
        ctx.AddInclude(match[1]);
      }
  
      ExternalFunctionEntity.#added.push(this.#file_path);
    }

    return this.#c_name;
  }
}
