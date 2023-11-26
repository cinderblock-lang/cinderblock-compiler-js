import { LinkerError } from "../linker/error";
import { CodeLocation } from "../location/code-location";
import { Component } from "./component";
import { ComponentGroup } from "./component-group";
import { WriterContext } from "./writer";

export class Namespace extends Component {
  readonly #name: string;
  readonly #exported: boolean;
  readonly #contents: ComponentGroup;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    name: string,
    contents: ComponentGroup
  ) {
    super(ctx);
    this.#name = name;
    this.#exported = exported;
    this.#contents = contents;
  }

  get Name() {
    return this.#name;
  }

  get Exported() {
    return this.#exported;
  }

  get Contents() {
    return this.#contents;
  }

  get type_name() {
    return "namespace";
  }

  c(ctx: WriterContext): string {
    return ``;
  }

  resolve_type(ctx: WriterContext): Component {
    throw new LinkerError(this.CodeLocation, "Should not be reachable");
  }
}
