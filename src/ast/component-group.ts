import { CodeLocation } from "../location/code-location";
import { Component } from "./component";

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

  find<T>(checker: abstract new (...args: any[]) => T): T {
    return this.#components.find((c) => c instanceof checker) as T;
  }

  find_all<T>(checker: abstract new (...args: any[]) => T): T[] {
    return this.#components.filter((c) => c instanceof checker) as T[];
  }
}
