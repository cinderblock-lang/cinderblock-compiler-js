import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { Type } from "./base";

export class UseType extends Type {
  readonly #name: string;
  readonly #constraints: ComponentGroup;

  constructor(ctx: CodeLocation, name: string, constraints: ComponentGroup) {
    super(ctx);
    this.#name = name;
    this.#constraints = constraints;
  }

  copy() {
    return this;
  }

  get Name() {
    return this.#name;
  }

  get Constraints() {
    return this.#constraints;
  }

  get type_name() {
    return "use_type";
  }

  c(ctx: WriterContext): string {
    throw new LinkerError(
      this.CodeLocation,
      "Use must not be in the concrete implementation"
    );
  }
}
