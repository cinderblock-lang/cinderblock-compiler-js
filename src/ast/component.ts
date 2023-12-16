import { CodeLocation } from "../location/code-location";
import { WriterContext } from "./writer";

export abstract class Component {
  readonly #location: CodeLocation;

  constructor(location: CodeLocation) {
    this.#location = location;
  }

  get CodeLocation() {
    return this.#location;
  }

  abstract get type_name(): string;

  abstract c(ctx: WriterContext): string;

  abstract resolve_type(ctx: WriterContext): Component;

  abstract compatible(target: Component, ctx: WriterContext): boolean;
}
