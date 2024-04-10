import { CodeLocation } from "../../location/code-location";
import { Component } from "../component";
import { ComponentGroup } from "../component-group";
import { Entity } from "./base";

export class FunctionEntity extends Entity {
  readonly #name: string;
  readonly #unsafe: boolean;
  readonly #parameters: ComponentGroup;
  readonly #content: ComponentGroup;
  readonly #returns: Component | undefined;
  readonly #namespace: string;
  readonly #using: Array<string>;

  constructor(
    ctx: CodeLocation,
    exported: boolean,
    name: string,
    unsafe: boolean,
    parameters: ComponentGroup,
    content: ComponentGroup,
    returns: Component | undefined,
    namespace: string,
    using: Array<string>
  ) {
    super(ctx, exported);
    this.#name = name;
    this.#unsafe = unsafe;
    this.#parameters = parameters;
    this.#content = content;
    this.#returns = returns;
    this.#namespace = namespace;
    this.#using = using;
  }
}
