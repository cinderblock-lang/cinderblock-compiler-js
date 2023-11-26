import { CodeLocation } from "../../location/code-location";
import { WriterContext } from "../writer";
import { Entity } from "./base";

export class UsingEntity extends Entity {
  readonly #name: string;

  constructor(ctx: CodeLocation, exported: boolean, name: string) {
    super(ctx, exported);
    this.#name = name;
  }

  get Name() {
    return this.#name;
  }

  get type_name() {
    return "using_entity";
  }

  c(ctx: WriterContext): string {
    ctx.using.push(this.Name);

    return ``;
  }
}
