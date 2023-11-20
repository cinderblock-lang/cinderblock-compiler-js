import {
  AccessExpression,
  Component,
  ComponentGroup,
  FunctionEntity,
  FunctionParameter,
  InvokationExpression,
  Property,
  ReferenceExpression,
  StoreStatement,
  StructEntity,
  Visitor,
} from "#compiler/ast";
import { PatternMatch, Location } from "#compiler/location";
import { LinkerError } from "../error";
import {
  ResolveBlock,
  ResolveExpression,
  ResolveExpressionType,
} from "./resolve";

export class LambdaReferencingVisitor extends Visitor {
  readonly #data: Array<{ func: FunctionEntity; struct: StructEntity }>;

  constructor(data: Array<{ func: FunctionEntity; struct: StructEntity }>) {
    super();
    this.#data = data;
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [FunctionEntity, InvokationExpression];
  }

  #FindExecutors(subject: StructEntity) {
    for (const { func, struct } of this.#data)
      if (struct === subject) return func;

    throw new LinkerError(subject.Location, "Could not find lambda");
  }

  #BuildInvokation(
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

  Visit(target: Component) {
    return PatternMatch(
      InvokationExpression,
      FunctionEntity,
      ReferenceExpression
    )(
      (
        invoke
      ): {
        result: Component | undefined;
        cleanup: () => void;
      } => {
        const store = ResolveExpression(invoke.Subject);
        if (!(store instanceof StoreStatement))
          return {
            result: undefined,
            cleanup: () => {},
          };

        const stored = ResolveExpressionType(store.Equals);
        if (!(stored instanceof StructEntity))
          return {
            result: undefined,
            cleanup: () => {},
          };

        const func = this.#FindExecutors(stored);

        return {
          result: this.#BuildInvokation(invoke.Location, store, stored, func, [
            ...invoke.Parameters.iterator(),
          ]),
          cleanup: () => {},
        };
      },
      (func) => {
        const returns = ResolveBlock(func.Content);

        if (!(returns instanceof StructEntity))
          return {
            result: undefined,
            cleanup: () => {},
          };

        return {
          result: new FunctionEntity(
            func.Location,
            func.Exported,
            func.Name,
            func.Parameters,
            returns,
            func.Content
          ),
          cleanup: () => {},
        };
      },
      (r) => {
        const referencing = r.References;
        if (!referencing)
          throw new LinkerError(r.Location, "Unresolved reference");

        if (
          !(referencing instanceof StoreStatement) &&
          !(referencing instanceof FunctionParameter)
        ) {
          return {
            result: undefined,
            cleanup: () => {},
          };
        }

        return {
          result: undefined,
          cleanup: () => {},
        };
      }
    )(target);
  }
}
