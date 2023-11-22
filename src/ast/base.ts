import { Location, Namer } from "#compiler/location";

export abstract class Component {
  readonly #location: Location;

  constructor(location: Location) {
    this.#location = location;
  }

  get Location() {
    return this.#location;
  }

  abstract get type_name(): string;
}

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

  get Location() {
    return new Location(
      this.First.Location.FileName,
      this.First.Location.StartLine,
      this.First.Location.StartColumn,
      this.Last.Location.EndLine,
      this.Last.Location.EndColumn
    );
  }

  get json() {
    return this.#components;
  }

  *iterator() {
    for (const component of this.#components) yield component;
  }

  map(handler: (input: Component) => Component) {
    return this.#components.map(handler);
  }
}

export class Ast {
  readonly #data: Array<Component>;

  constructor(...data: Array<ComponentGroup>) {
    this.#data = data.flatMap((d) => [...d.iterator()]);
  }

  *iterator() {
    for (const item of this.#data) yield item;
  }
}
