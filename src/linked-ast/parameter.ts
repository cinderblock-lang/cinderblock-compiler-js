import { CodeLocation } from "../location/code-location";
import { LinkedSubItem } from "./sub-item";
import { LinkedType } from "./type/base";

export class LinkedParameter extends LinkedSubItem {
  readonly #optional: boolean;

  constructor(
    ctx: CodeLocation,
    name: string,
    type: LinkedType,
    optional: boolean
  ) {
    super(ctx, name, type);
    this.#optional = optional;
  }

  get Optional() {
    return this.#optional;
  }
}
