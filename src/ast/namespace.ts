import { CodeLocation } from "../location/code-location";
import { Component } from "./component";
import { ComponentGroup } from "./component-group";

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
}
