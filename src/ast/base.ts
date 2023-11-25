import { Location } from "#compiler/location";
import {
  FunctionEntity,
  ExternalFunctionDeclaration,
  BuiltInFunction,
  SchemaEntity,
  StructEntity,
  Type,
  InvokationExpression,
  Namespace,
  UsingEntity,
} from ".";
import { PatternMatch, RequireType } from "../location/pattern-match";

export interface CFile {
  add_global(data: string): void;
  add_include(data: string): void;
}

type AnyFunction =
  | FunctionEntity
  | ExternalFunctionDeclaration
  | BuiltInFunction;

type AnyType = StructEntity | SchemaEntity;

export type WriterContext = {
  global_functions: Record<string, AnyFunction>;
  global_types: Record<string, AnyType>;

  namespace: string;
  using: Array<string>;
  parameters: Record<string, Type>;
  locals: Record<string, Type>;

  use_types: Record<string, Type>;

  invokation?: InvokationExpression;

  file: CFile;

  prefix: Array<string>;
  suffix: Array<string>;
};

export abstract class Component {
  readonly #location: Location;

  constructor(location: Location) {
    this.#location = location;
  }

  get Location() {
    return this.#location;
  }

  abstract get type_name(): string;

  abstract c(ctx: WriterContext): string;
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

export class Ast {
  readonly #data: Array<Component>;

  constructor(...data: Array<ComponentGroup>) {
    this.#data = data.flatMap((d) => [...d.iterator()]);
  }

  *iterator() {
    for (const item of this.#data) yield item;
  }

  with(input: ComponentGroup) {
    return new Ast(new ComponentGroup(...this.#data), input);
  }

  c(): string {
    const global_functions: Record<string, AnyFunction> = {};
    const global_types: Record<string, AnyType> = {};

    for (const namespace of this.iterator()) {
      RequireType(Namespace, namespace);

      for (const entity of namespace.Contents.iterator()) {
        PatternMatch(
          FunctionEntity,
          ExternalFunctionDeclaration,
          BuiltInFunction,
          StructEntity,
          SchemaEntity,
          UsingEntity
        )(
          (f) => {
            global_functions[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_functions[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_functions[f.Name] = f;
          },
          (f) => {
            global_types[namespace.Name + "." + f.Name] = f;
          },
          (f) => {
            global_types[namespace.Name + "." + f.Name] = f;
          },
          (f) => {}
        )(entity);
      }
    }

    for (const namespace of this.iterator()) {
      RequireType(Namespace, namespace);
      if (namespace.Name !== "App") continue;

      for (const entity of namespace.Contents.iterator()) {
        if (!(entity instanceof FunctionEntity)) continue;
        if (entity.Name !== "main") continue;

        const includes: Array<string> = ["<stdlib.h>", "<dlfcn.h>"];
        const globals: Array<string> = [];

        const prefix: Array<string> = [];
        const suffix: Array<string> = [];

        const c = entity.c({
          global_functions,
          global_types,
          namespace: "App",
          using: [],
          parameters: {},
          locals: {},
          use_types: {},

          prefix,
          suffix,
          file: {
            add_global: (line) => globals.unshift(line),
            add_include: (line) => includes.unshift(line),
          },
        });

        return `${includes.map((i) => `#include ${i}`).join("\n")}\n\n${globals
          .reverse()
          .join("\n\n")}\n\n${c}`;
      }
    }

    throw new Error("Could not find a main function");
  }
}
