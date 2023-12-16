import { LinkerError } from "../linker/error";
import { CodeLocation } from "../location/code-location";
import { Component } from "./component";
import { ReturnStatement } from "./statement/return";
import { WriterContext } from "./writer";

export class ComponentGroup {
  readonly #components: Array<Component>;

  constructor(...components: Array<Component>) {
    this.#components = components;
  }

  get Length() {
    return this.#components.length;
  }

  get First() {
    return this.#components[0];
  }

  get Last() {
    return this.#components[this.#components.length - 1];
  }

  get CodeLocation() {
    return new CodeLocation(
      this.First.CodeLocation.FileName,
      this.First.CodeLocation.StartLine,
      this.First.CodeLocation.StartColumn,
      this.Last.CodeLocation.EndLine,
      this.Last.CodeLocation.EndColumn
    );
  }

  get json() {
    return this.#components;
  }

  *iterator() {
    for (const component of this.#components) yield component;
  }

  map<T>(handler: (input: Component) => T) {
    return this.#components.map(handler);
  }

  filter(predicate: (item: Component) => boolean) {
    return this.#components.filter(predicate);
  }

  find<T>(checker: abstract new (...args: any[]) => T): T {
    return this.#components.find((c) => c instanceof checker) as T;
  }

  find_all<T>(checker: abstract new (...args: any[]) => T): T[] {
    return this.#components.filter((c) => c instanceof checker) as T[];
  }

  resolve_block_type(ctx: WriterContext, name: string) {
    ctx = ctx.WithBody(this, name);
    for (const statement of this.iterator()) {
      if (statement instanceof ReturnStatement) {
        return statement.Value.resolve_type(ctx);
      }
    }

    throw new LinkerError(this.CodeLocation, "All blocks must return a value");
  }

  compatible(target: ComponentGroup, ctx: WriterContext): boolean {
    if (this.#components.length !== target.#components.length) return false;
    for (let i = 0; i < this.#components.length; i++) {
      if (!this.#components[i]?.compatible(target.#components[i], ctx))
        return false;
    }

    return true;
  }
}
