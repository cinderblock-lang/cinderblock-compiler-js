import {
  BuiltInFunction,
  Component,
  FunctionEntity,
  Namespace,
  StoreStatement,
  StructEntity,
  Visitor,
} from "#compiler/ast";
import { Namer, PatternMatch } from "#compiler/location";

export class NameFlatteningVisitor extends Visitor {
  #exported: boolean = false;
  #namespace: string = "";

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [
      FunctionEntity,
      StructEntity,
      StoreStatement,
      Namespace,
      BuiltInFunction,
    ];
  }

  Visit(target: Component) {
    return PatternMatch(
      FunctionEntity,
      StructEntity,
      StoreStatement,
      Namespace,
      BuiltInFunction
    )(
      (func) =>
        this.#exported || (this.#namespace === "App" && func.Name === "main")
          ? { result: undefined, cleanup: () => {} }
          : {
              result: new FunctionEntity(
                func.Location,
                func.Exported,
                Namer.GetName(),
                func.Parameters,
                func.Returns,
                func.Content
              ) as Component,
              cleanup: () => {},
            },
      (struct) => ({
        result: new StructEntity(
          struct.Location,
          struct.Exported,
          Namer.GetName(),
          struct.Properties
        ),
        cleanup: () => {},
      }),
      (store) => ({
        result: new StoreStatement(
          store.Location,
          Namer.GetName(),
          store.Equals,
          store.Type
        ),
        cleanup: () => {},
      }),
      (namespace) => {
        this.#exported = namespace.Exported;
        this.#namespace = namespace.Name;
        return {
          result: undefined,
          cleanup: () => {
            this.#namespace = "";
            this.#exported = false;
          },
        };
      },
      (b) => ({
        cleanup: () => {},
        result: new BuiltInFunction(
          b.Location,
          Namer.GetName(),
          b.Parameters,
          b.Returns,
          b.Source,
          b.Requires,
          b.Allocates
        ),
      })
    )(target);
  }
}
