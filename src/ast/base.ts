import { Location, Namer } from "#compiler/location";
import { AsyncLocalStorage } from "node:async_hooks";

const visiting_context = new AsyncLocalStorage<Array<number>>();

export abstract class Visitor {
  abstract get OperatesOn(): Array<new (...args: any[]) => Component>;

  abstract Visit(target: Component): {
    result: Component | undefined;
    cleanup: () => void;
  };
}

const _index = Symbol();
const _children = Symbol();

export function AstItem(
  target: new (...args: any[]) => Component,
  _: ClassDecoratorContext
) {
  const result = function (...args: any[]) {
    const instance = new target(...args);

    const index = ComponentStore.Register(instance);
    instance[_index] = index;
    instance[_children] = (
      args.filter(
        (a) => a instanceof Component || a instanceof ComponentGroup
      ) as Array<Component | ComponentGroup>
    ).flatMap((c) =>
      c instanceof Component ? [c.Index] : [...c.iterator()].map((c) => c.Index)
    );
    return instance;
  };

  result.prototype = target.prototype;
  return result as any;
}

export abstract class Component {
  readonly #location: Location;
  [_index]: number = -1;
  [_children]: Array<number> = [];

  constructor(location: Location) {
    this.#location = location;
  }

  get Location() {
    return this.#location;
  }

  get Index() {
    return this[_index];
  }

  abstract get type_name(): string;

  abstract get extra_json(): Record<never, never>;

  get json(): unknown {
    return {
      ...this.extra_json,
      type: this.type_name,
      location: this.#location.json,
    };
  }
}

export class ComponentStore {
  static #data: Record<number, Component> = [];
  static #index = 0;

  static Register(component: Component) {
    const i = this.#index;
    this.#data = { ...this.#data, [this.#index]: component };
    this.#index++;

    return i;
  }

  static #Get(index: number) {
    const result = this.#data[index];
    if (!result) throw new Error("Could not find component");

    return result;
  }

  static Get(index: number) {
    return this.#Get(index);
  }

  static Replace(subject: Component, updated: Component) {
    this.#data[subject.Index] = updated;
    delete this.#data[updated.Index];
    updated[_index] = subject[_index];
  }

  static Visit(item: Component, visitor: Visitor) {
    return visiting_context.run(visiting_context.getStore() ?? [], () => {
      if (visiting_context.getStore()?.includes(item.Index)) return item;

      visiting_context.getStore()?.push(item.Index);
      const instance = this.#Get(item.Index);

      if (visitor.OperatesOn.find((o) => instance instanceof o)) {
        const { result, cleanup } = visitor.Visit(instance);

        if (result) {
          cleanup();
          this.Replace(item, result);
        }

        for (const child of instance[_children]) {
          this.Visit(this.#Get(child), visitor);
        }

        cleanup();
      } else {
        for (const child of instance[_children]) {
          this.Visit(this.#Get(child), visitor);
        }
      }

      return this.#Get(item.Index);
    });
  }

  static get Json() {
    const result: Record<string, unknown> = {};
    for (const key in this.#data) result[key.toString()] = this.#data[key].json;
    return result;
  }

  static Clear() {
    this.#data = {};
    this.#index = 0;
    Namer.Reset();
  }
}

export class ComponentGroup {
  readonly #components: Array<number>;

  constructor(...components: Array<Component>) {
    this.#components = components.map((c) => c.Index);
  }

  get Length() {
    return this.#components.length;
  }

  get First() {
    return ComponentStore.Get(this.#components[0]);
  }

  get Last() {
    return ComponentStore.Get(this.#components[this.#components.length - 1]);
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
    for (const component of this.#components)
      yield ComponentStore.Get(component);
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

  get json() {
    return this.#data.flatMap((d) => d.json);
  }

  visited(visitor: Visitor) {
    const result: Array<Component> = [];

    for (const item of this.#data)
      result.push(ComponentStore.Visit(item, visitor));

    return new Ast(...result.map((c) => new ComponentGroup(c)));
  }

  with(file: ComponentGroup) {
    return new Ast(new ComponentGroup(...this.#data), file);
  }
}
