import { CodeLocation } from "../../location/code-location";
import { ComponentGroup } from "../component-group";
import { WriterContext } from "../writer";
import { Entity } from "./base";

export class SystemEntity extends Entity {
  readonly #content: ComponentGroup;

  constructor(ctx: CodeLocation, exported: boolean, content: ComponentGroup) {
    super(ctx, exported);
    this.#content = content;
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
}
