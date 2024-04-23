import { CodeLocation } from "../location/code-location";
import { LinkedComponent } from "./component";
import { LinkedType } from "./type/base";

export class SubItem extends LinkedComponent {
  readonly #name: string;
  readonly #type: LinkedType;
  readonly #optional: boolean;

  constructor(ctx: CodeLocation, name: string, type: LinkedType, optional: boolean) {
    super(ctx);
    this.#name = name;
    this.#type = type;
    this.#optional = optional;
  }

  get Name() {
    return this.#name;
  }

  get Type() {
    return this.#type;
  }

  get Optional() {
    return this.#optional;
  }
}
