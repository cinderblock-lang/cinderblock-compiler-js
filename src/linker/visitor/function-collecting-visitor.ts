import {
  BuiltInFunction,
  Component,
  ExternalFunctionDeclaration,
  FunctionEntity,
  Namespace,
  Visitor,
} from "#compiler/ast";
import { LinkerError } from "../error";

export class FunctionCollectingVisitor extends Visitor {
  #functions: Record<
    string,
    FunctionEntity | ExternalFunctionDeclaration | BuiltInFunction
  > = {};
  #namespace: string = "";

  constructor() {
    super();
  }

  get Functions() {
    return this.#functions;
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [
      Namespace,
      FunctionEntity,
      ExternalFunctionDeclaration,
      BuiltInFunction,
    ];
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
      target instanceof FunctionEntity ||
      target instanceof ExternalFunctionDeclaration
    ) {
      this.#functions[`${this.#namespace}.${target.Name}`] = target;
      return {
        result: undefined,
        cleanup: () => {},
      };
    } else if (target instanceof BuiltInFunction) {
      this.#functions[target.Name] = target;
    }

    throw new LinkerError(
      target.Location,
      "Component is not a recognised type"
    );
  }
}
