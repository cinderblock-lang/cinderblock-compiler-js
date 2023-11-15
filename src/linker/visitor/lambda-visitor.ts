import {
  Component,
  ComponentGroup,
  ComponentStore,
  InvokationExpression,
  LambdaExpression,
  StoreStatement,
  StructEntity,
} from "#compiler/ast";
import { PatternMatch } from "#compiler/location";
import { ContextBuildingVisitor } from "./context-building-visitor";
import { ResolveBlock, ResolveExpression } from "./resolve";

export class LambdaVisitor extends ContextBuildingVisitor {
  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [...super.OperatesOn, InvokationExpression, LambdaExpression];
  }

  Visit(target: Component): {
    result: Component | undefined;
    cleanup: () => void;
  } {
    return PatternMatch(InvokationExpression, LambdaExpression, Component)(
      (invoke) => {
        const store = ResolveExpression(invoke.Subject);
        if (!(store instanceof StoreStatement))
          return {
            result: undefined,
            cleanup: () => {},
          };

        const stored = store.Type;
        if (!(stored instanceof StructEntity))
          return {
            result: undefined,
            cleanup: () => {},
          };

        const func = this.FindExecutors(stored);

        return {
          result: this.BuildInvokation(invoke.Location, store, stored, func, [
            ...invoke.Parameters.iterator(),
          ]),
          cleanup: () => {},
        };
      },
      (lambda) => {
        const input = this.BuildContext(
          lambda.Location,
          lambda.Parameters,
          ResolveBlock(lambda.Body),
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
      },
      super.Visit.bind(this)
    )(target);
  }
}
