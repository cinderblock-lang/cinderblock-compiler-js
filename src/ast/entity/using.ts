import { LinkerError } from "../../linker/error";
import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
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
    return ``;
  }

  compatible(target: Component): boolean {
    return false;
  }

  resolve_type(ctx: WriterContext): Component {
    throw new LinkerError(
      this.CodeLocation,
      "Should not be able to reach here"
    );
  }
}
