import {
  Component,
  FunctionEntity,
  Namespace,
  SchemaEntity,
  StructEntity,
  UseType,
  UsingEntity,
  Visitor,
} from "#compiler/ast";
import { PatternMatch } from "#compiler/location";

export class TypeCollectorVisitor extends Visitor {
  readonly #types: Record<string, StructEntity | SchemaEntity>;
  #namespace: string = "";
  #using: Array<string> = [];
  #uses: Record<string, UseType> = {};

  constructor(types: Record<string, StructEntity | SchemaEntity>) {
    super();
    this.#types = types;
  }

  protected find(name: string) {
    if (this.#uses[name]) return this.#uses[name];

    for (const area of this.#using) {
      const full = `${area}.${name}`;
      const possible = this.#types[full];
      if (!possible) continue;

      if (area === this.#namespace) return possible;

      if (possible.Exported) return possible;
    }

    return undefined;
  }
  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [Namespace, UsingEntity, FunctionEntity, UseType];
  }

  Visit(target: Component): {
    result: Component | undefined;
    cleanup: () => void;
  } {
    return PatternMatch(Namespace, UsingEntity, FunctionEntity, UseType)(
      (namespace) => {
        this.#namespace = namespace.Name;
        this.#using = [namespace.Name];
        return {
          result: undefined,
          cleanup: () => {
            this.#using = [];
            this.#uses = {};
            this.#namespace = "";
          },
        };
      },
      (using) => {
        this.#using = [...this.#using, using.Name];
        return {
          result: undefined,
          cleanup: () => {},
        };
      },
      (functione) => {
        this.#uses = {};
        return {
          result: undefined,
          cleanup: () => {
            this.#uses = {};
          },
        };
      },
      (use) => {
        this.#uses[use.Name] = use;
        return {
          result: undefined,
          cleanup: () => {},
        };
      }
    )(target);
  }
}
