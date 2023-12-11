import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { Entity } from "./base";

export class SystemEntity extends Entity {
  readonly #name: string;
  readonly #content: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    name: string,
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
    return "system_entity";
  }

  get more_json() {
    return {
      content: this.#content.json,
    };
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
      "Should not be able to reach here"
    );
  }
}
