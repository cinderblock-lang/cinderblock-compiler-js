import {
  Component,
  ComponentGroup,
  ComponentStore,
  LambdaExpression,
} from "#compiler/ast";
import { PatternMatch } from "#compiler/location";
import { ContextBuildingVisitor } from "./context-building-visitor";
import { ResolveBlockType } from "./resolve";

export class LambdaSwappingVisitor extends ContextBuildingVisitor {
  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [...super.OperatesOn, LambdaExpression];
  }

  Visit(target: Component): {
    result: Component | undefined;
    cleanup: () => void;
  } {
    return PatternMatch(LambdaExpression, Component)((lambda) => {
      const input = this.BuildContext(
        lambda.Location,
        lambda.Parameters,
        ResolveBlockType(lambda.Body),
        new ComponentGroup(
          ...[...lambda.Body.iterator()].map((b) =>
            ComponentStore.Visit(b, this)
          )
        )
      );

      return {
        result: input.make,
        cleanup: () => {},
      };
    }, super.Visit.bind(this))(target);
  }
}
