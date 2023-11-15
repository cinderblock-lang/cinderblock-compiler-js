import {
  AccessExpression,
  AssignStatement,
  Component,
  ComponentGroup,
  FunctionEntity,
  FunctionParameter,
  InvokationExpression,
  IterateExpression,
  MakeExpression,
  Namespace,
  Property,
  ReferenceExpression,
  StoreStatement,
  StructEntity,
} from "#compiler/ast";
import { Location, Namer, PatternMatch } from "#compiler/location";
import { LinkerError } from "../error";
import { ResolveExpression } from "./resolve";
import { ReferenceNameIndexingVisitor } from "./reference-name-indexing-visitor";

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

  protected FindExecutors(subject: StructEntity) {
    for (const { func, struct } of this.#data)
      if (struct === subject) return func;

    throw new LinkerError(subject.Location, "Could not find lambda");
  }

  protected BuildInvokation(
    location: Location,
    store: StoreStatement,
    stored: StructEntity,
    func: FunctionEntity,
    extra: Array<Component>
  ) {
    return new InvokationExpression(
      location,
      new ReferenceExpression(location, func.Name, func),
      new ComponentGroup(
        ...[...stored.Properties.iterator()].map((p) => {
          if (!(p instanceof Property))
            throw new LinkerError(p.Location, "Invalid property type");
          return new AccessExpression(
            p.Location,
            new ReferenceExpression(p.Location, stored.Name, store),
            p.Name
          );
        }),
        ...extra
      )
    );
  }

  protected BuildContext(
    location: Location,
    parameters: ComponentGroup,
    returns: Component,
    body: ComponentGroup
  ) {
    const ensure = (subject: Component | undefined) => {
      if (!subject) {
        throw new LinkerError(location, "Missing property");
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
              new Property(store.Location, n, ensure(store.Type), false),
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

    const result = {
      func: new FunctionEntity(
        location,
        false,
        Namer.GetName(),
        new ComponentGroup(
          ...this.locals.map(([n, v]) =>
            PatternMatch(StoreStatement, IterateExpression, FunctionParameter)(
              (store) =>
                new FunctionParameter(
                  store.Location,
                  n,
                  ensure(store.Type),
                  false
                ),
              (iterate) =>
                new FunctionParameter(
                  iterate.Location,
                  n,
                  ResolveExpression(iterate.Over),
                  false
                ),
              (parameter) =>
                new FunctionParameter(
                  parameter.Location,
                  n,
                  ensure(parameter.Type),
                  parameter.Optional
                )
            )(v)
          ),
          ...parameters.iterator()
        ),
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
