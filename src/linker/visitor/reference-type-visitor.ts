import {
  Component,
  IsPrimitiveName,
  MakeExpression,
  PrimitiveType,
  ReferenceType,
  SchemaEntity,
  StructEntity,
} from "#compiler/ast";
import { TypeCollectorVisitor } from "./type-collector-visitor";
import { LinkerError } from "../error";

export class ReferenceTypeVisitor extends TypeCollectorVisitor {
  constructor(types: Record<string, StructEntity | SchemaEntity>) {
    super(types);
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [...super.OperatesOn, ReferenceType, MakeExpression];
  }

  Visit(target: Component) {
    if (target instanceof ReferenceType) {
      const possible = this.find(target.Name);

      if (possible)
        return {
          result: new ReferenceType(target.Location, target.Name, possible),
          cleanup: () => {},
        };

      if (IsPrimitiveName(target.Name))
        return {
          result: new PrimitiveType(target.Location, target.Name),
          cleanup: () => {},
        };

      throw new LinkerError(
        target.Location,
        `Could not resolve symbol: ${target.Name}`
      );
    } else if (target instanceof MakeExpression) {
      const result = this.find(target.Struct);
      if (!(result instanceof StructEntity))
        throw new LinkerError(target.Location, "Only structs may be made");
      return {
        result: new MakeExpression(
          target.Location,
          target.Struct,
          target.Using,
          result
        ),
        cleanup: () => {},
      };
    }

    return super.Visit(target);
  }
}
