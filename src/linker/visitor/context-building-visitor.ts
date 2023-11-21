import {
  AccessExpression,
  AssignStatement,
  Component,
  ComponentGroup,
  ComponentStore,
  FunctionEntity,
  FunctionParameter,
  FunctionType,
  IterateExpression,
  MakeExpression,
  Namespace,
  Property,
  ReferenceExpression,
  ReferenceType,
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

    const main_struct_reference = new ReferenceType(location, Namer.GetName());

    const ctx_parameter = new FunctionParameter(
      location,
      "ctx",
      main_struct_reference,
      false
    );

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
        ),
        new Property(
          location,
          "handler",
          new FunctionType(
            location,
            new ComponentGroup(ctx_parameter, ...[...parameters.iterator()]),
            returns
          ),
          false
        )
      )
    );

    ComponentStore.Replace(
      main_struct_reference,
      new ReferenceType(location, Namer.GetName(), struct)
    );

    const ps = this.locals.map(([n, v]) =>
      PatternMatch(StoreStatement, IterateExpression, FunctionParameter)(
        (store) =>
          [
            store as Component,
            new AccessExpression(
              store.Location,
              new ReferenceExpression(
                store.Location,
                ctx_parameter.Name,
                ctx_parameter
              ),
              store.Name
            ) as Component,
          ] as const,
        (iterate) =>
          [
            iterate,
            new AccessExpression(
              iterate.Location,
              new ReferenceExpression(
                iterate.Location,
                ctx_parameter.Name,
                ctx_parameter
              ),
              iterate.As
            ),
          ] as const,
        (parameter) =>
          [
            parameter,
            new AccessExpression(
              parameter.Location,
              new ReferenceExpression(
                parameter.Location,
                ctx_parameter.Name,
                ctx_parameter
              ),
              parameter.Name
            ),
          ] as const
      )(v)
    );

    const visitor = new ReferenceSwapperVisitor(ps);

    for (const item of body.iterator()) {
      ComponentStore.DeepVisit(item, visitor);
    }

    const func = new FunctionEntity(
      location,
      false,
      Namer.GetName(),
      new ComponentGroup(ctx_parameter, ...parameters.iterator()),
      returns,
      body
    );

    const result = {
      func,
      struct,
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
          ),
          new AssignStatement(
            location,
            "handler",
            new ReferenceExpression(location, func.Name, func)
          )
        ),
        struct
      ),
    };

    this.#data.push(result);

    return result;
  }
}
