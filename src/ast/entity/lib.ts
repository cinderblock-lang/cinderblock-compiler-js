import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { Expression } from "../expression/base";
import { WriterContext } from "../writer";
import { Entity } from "./base";

export class LibEntity extends Entity {
  readonly #name: Component;
  readonly #content: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    name: Expression,
    content: ComponentGroup
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#content = content;
  }

  get Name() {
    return this.#name;
  }

  get Content() {
    return this.#content;
  }

  get type_name() {
    return "lib_entity";
  }

  c(ctx: WriterContext): string {
    console.warn(
      "Currently, external functions are not supported and will be ignored"
    );
    return ``;
  }

  resolve_type(ctx: WriterContext): Component {
    throw new LinkerError(
      this.CodeLocation,
      "Should not be able to link to here"
    );
  }
}
