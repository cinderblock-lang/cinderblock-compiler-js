import {
  Component,
  Namespace,
  SchemaEntity,
  StructEntity,
  Visitor,
} from "#compiler/ast";
import { LinkerError } from "../error";

export class TypeNameIndexingVisitor extends Visitor {
  #types: Record<string, StructEntity | SchemaEntity> = {};
  #namespace: string = "";

  constructor() {
    super();
  }

  get Types() {
    return this.#types;
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [Namespace, StructEntity, SchemaEntity];
  }

  Visit(target: Component) {
    if (target instanceof Namespace) {
      this.#namespace = target.Name;
      return {
        result: undefined,
        cleanup: () => {
          this.#namespace = "";
        },
      };
    } else if (
      target instanceof StructEntity ||
      target instanceof SchemaEntity
    ) {
      this.#types[`${this.#namespace}.${target.Name}`] = target;
      return {
        result: undefined,
        cleanup: () => {},
      };
    }

    throw new LinkerError(
      target.Location,
      "Component is not a recognised type"
    );
  }
}
