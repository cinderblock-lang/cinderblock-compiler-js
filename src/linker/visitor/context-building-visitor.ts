import {
  AssignStatement,
  Component,
  ComponentGroup,
  ComponentStore,
  FunctionEntity,
  FunctionParameter,
  IterateExpression,
  MakeExpression,
  Namespace,
  Property,
  ReferenceExpression,
  StoreStatement,
  StructEntity,
  Visitor,
} from "#compiler/ast";
import { Location, Namer, PatternMatch } from "#compiler/location";
import { LinkerError } from "../error";
import { ResolveExpression, ResolveExpressionType } from "./resolve";
import { ReferenceNameIndexingVisitor } from "./reference-name-indexing-visitor";

class ReferenceSwapperVisitor extends Visitor {
  readonly #locals: Array<readonly [Component, Component]>;

  constructor(locals: Array<readonly [Component, Component]>) {
    super();
    this.#locals = locals;
  }

  get OperatesOn() {
    return [ReferenceExpression];
  }

  Visit(target: Component): {
    result: Component | undefined;
    cleanup: () => void;
  } {
    if (target instanceof ReferenceExpression) {
      const match = this.#locals.find(
        (r) => r[0].Index === target.References?.Index
      );

      if (!match) return { result: undefined, cleanup: () => {} };

      return {
        result: new ReferenceExpression(target.Location, target.Name, match[1]),
        cleanup: () => {},
      };
    }

    throw new LinkerError(target.Location, "No handler found");
  }
}

export class ContextBuildingVisitor extends ReferenceNameIndexingVisitor {
  #data: Array<{ func: FunctionEntity; struct: StructEntity }> = [];

  get Namespace() {
    return new Namespace(
      new Location("generated", -1, -1, -1, -1),
      false,
      "__Compiled__Code__",
      new ComponentGroup(...this.#data.flatMap((l) => [l.struct, l.func]))
    );
  }

  get Data() {
    return this.#data;
  }

  protected BuildContext(
    location: Location,
    parameters: ComponentGroup,
    returns: Component,
    body: ComponentGroup
  ) {
    const ensure = (subject: Component | undefined) => {
      if (!subject) {
        throw new LinkerError(location, "Missing property " + subject);
      }

      return subject;
    };

    const struct = new StructEntity(
      location,
      false,
      Namer.GetName(),
      new ComponentGroup(
        ...this.locals.map(([n, v]) =>
          PatternMatch(StoreStatement, IterateExpression, FunctionParameter)(
            (store) =>
              new Property(
                store.Location,
                n,
                ResolveExpressionType(store.Equals),
                false
              ),
            (iterate) =>
              new Property(
                iterate.Location,
                n,
                ResolveExpression(iterate.Over),
                false
              ),
            (parameter) =>
              new Property(
                parameter.Location,
                n,
                ensure(parameter.Type),
                parameter.Optional
              )
          )(v)
        )
      )
    );

    const ps = this.locals.map(([n, v]) =>
      PatternMatch(StoreStatement, IterateExpression, FunctionParameter)(
        (store) =>
          [
            store as Component,
            new FunctionParameter(
              store.Location,
              n,
              ResolveExpressionType(store.Equals),
              false
            ) as Component,
          ] as const,
        (iterate) =>
          [
            iterate,
            new FunctionParameter(
              iterate.Location,
              n,
              ResolveExpression(iterate.Over),
              false
            ),
          ] as const,
        (parameter) =>
          [
            parameter,
            new FunctionParameter(
              parameter.Location,
              n,
              ensure(parameter.Type),
              parameter.Optional
            ),
          ] as const
      )(v)
    );

    const visitor = new ReferenceSwapperVisitor(ps);

    for (const item of body.iterator()) {
      ComponentStore.DeepVisit(item, visitor);
    }

    const result = {
      func: new FunctionEntity(
        location,
        false,
        Namer.GetName(),
        new ComponentGroup(...ps.map((p) => p[1]), ...parameters.iterator()),
        returns,
        body
      ),
      struct: struct,
      make: new MakeExpression(
        location,
        struct.Name,
        new ComponentGroup(
          ...this.locals.map(
            ([n, v]) =>
              new AssignStatement(
                v.Location,
                n,
                new ReferenceExpression(location, n, v)
              )
          )
        ),
        struct
      ),
    };

    this.#data.push(result);

    return result;
  }
}
