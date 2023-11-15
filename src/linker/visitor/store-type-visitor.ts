import {
  Component,
  SchemaEntity,
  StoreStatement,
  StructEntity,
} from "#compiler/ast";
import { TypeCollectorVisitor } from "./type-collector-visitor";
import { ResolveExpression } from "./resolve";

export class StoreTypeVisitor extends TypeCollectorVisitor {
  constructor(types: Record<string, StructEntity | SchemaEntity>) {
    super(types);
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [...super.OperatesOn, StoreStatement];
  }

  Visit(target: Component) {
    if (target instanceof StoreStatement) {
      return {
        result: new StoreStatement(
          target.Location,
          target.Name,
          target.Equals,
          ResolveExpression(target.Equals)
        ),
        cleanup: () => {},
      };
    }

    return super.Visit(target);
  }
}
