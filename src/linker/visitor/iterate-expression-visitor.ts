import {
  AccessExpression,
  AssignStatement,
  Component,
  ComponentGroup,
  ComponentStore,
  FunctionParameter,
  FunctionType,
  InvokationExpression,
  IterableType,
  IterateExpression,
  LambdaExpression,
  MakeExpression,
  Namespace,
  PrimitiveType,
  Property,
  ReferenceExpression,
  ReferenceType,
  ReturnStatement,
  StoreStatement,
  StructEntity,
  Visitor,
} from "#compiler/ast";
import { Location, Namer } from "#compiler/location";
import { LinkerError } from "../error";
import { ResolveBlock, ResolveExpression } from "./resolve";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

class IterateStoreVisitor extends Visitor {
  readonly #loop: IterateExpression;
  readonly #target: FunctionParameter;

  constructor(loop: IterateExpression, target: FunctionParameter) {
    super();
    this.#loop = loop;
    this.#target = target;
  }

  get OperatesOn() {
    return [ReferenceExpression];
  }

  Visit(target: Component) {
    if (target instanceof ReferenceExpression) {
      if (target.References !== this.#loop)
        return { result: undefined, cleanup: () => {} };

      return {
        result: new ReferenceExpression(
          target.Location,
          target.Name,
          this.#target
        ),
        cleanup: () => {},
      };
    }

    throw new LinkerError(
      target.Location,
      "Component is not a recognised type"
    );
  }
}

export class IterateExpressionVisitor extends Visitor {
  #data: Array<StructEntity> = [];

  get Namespace() {
    return new Namespace(
      EmptyLocation,
      false,
      "__Compiled__Code__",
      new ComponentGroup(...this.#data)
    );
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [IterateExpression];
  }

  Visit(target: Component) {
    if (target instanceof IterateExpression) {
      const store = ResolveExpression(target.Over);
      if (
        !(store instanceof StoreStatement) &&
        !(store instanceof FunctionParameter)
      )
        return {
          result: undefined,
          cleanup: () => {},
        };

      const stored = store.Type;
      if (!stored || !(stored instanceof IterableType))
        return {
          result: undefined,
          cleanup: () => {},
        };

      const main_reference = new ReferenceType(
        target.Location,
        Namer.GetName()
      );

      const main = new StructEntity(
        target.Location,
        false,
        Namer.GetName(),
        new ComponentGroup(
          new Property(
            target.Location,
            "next",
            new FunctionType(
              target.Location,
              new ComponentGroup(),
              main_reference
            ),
            false
          ),
          new Property(
            target.Location,
            "done",
            new PrimitiveType(target.Location, "bool"),
            false
          ),
          new Property(
            target.Location,
            "result",
            new ReferenceType(
              target.Location,
              Namer.GetName(),
              ResolveBlock(target.Body)
            ),
            true
          )
        )
      );

      const main_param = new FunctionParameter(
        target.Location,
        target.As,
        stored.Type,
        false
      );

      const main_func = new StoreStatement(
        target.Location,
        Namer.GetName(),
        new LambdaExpression(
          target.Location,
          new ComponentGroup(main_param),
          target.Body
        ),
        new FunctionType(
          target.Location,
          new ComponentGroup(main_param),
          ResolveExpression(target.Over)
        )
      );

      const wrapper_param = new FunctionParameter(
        target.Location,
        Namer.GetName(),
        stored,
        false
      );

      const wrapper_reference = new ReferenceExpression(
        target.Location,
        Namer.GetName()
      );

      const wrapper_func = new StoreStatement(
        target.Location,
        Namer.GetName(),
        new LambdaExpression(
          target.Location,
          new ComponentGroup(wrapper_param),
          new ComponentGroup(
            new ReturnStatement(
              target.Location,
              new MakeExpression(
                target.Location,
                main.Name,
                new ComponentGroup(
                  new AssignStatement(
                    target.Location,
                    "done",
                    new AccessExpression(
                      target.Location,
                      new ReferenceExpression(
                        target.Location,
                        wrapper_param.Name,
                        wrapper_param
                      ),
                      "done"
                    )
                  ),
                  new AssignStatement(
                    target.Location,
                    "result",
                    new InvokationExpression(
                      target.Location,
                      new ReferenceExpression(
                        target.Location,
                        main_func.Name,
                        main_func
                      ),
                      new ComponentGroup(
                        new AccessExpression(
                          target.Location,
                          new ReferenceExpression(
                            target.Location,
                            wrapper_param.Name,
                            wrapper_param
                          ),
                          "result"
                        )
                      )
                    )
                  ),
                  new AssignStatement(
                    target.Location,
                    "next",
                    new LambdaExpression(
                      target.Location,
                      new ComponentGroup(),
                      new ComponentGroup(
                        new ReturnStatement(
                          target.Location,
                          new InvokationExpression(
                            target.Location,
                            wrapper_reference,
                            new ComponentGroup(
                              new InvokationExpression(
                                target.Location,
                                new AccessExpression(
                                  target.Location,
                                  new ReferenceExpression(
                                    target.Location,
                                    wrapper_param.Name,
                                    wrapper_param
                                  ),
                                  "next"
                                ),
                                new ComponentGroup()
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                ),
                main
              )
            )
          )
        ),
        new FunctionType(
          target.Location,
          new ComponentGroup(wrapper_param),
          main_reference
        )
      );

      ComponentStore.Replace(
        main_reference,
        new ReferenceType(target.Location, Namer.GetName(), main)
      );

      ComponentStore.Replace(
        wrapper_reference,
        new ReferenceExpression(target.Location, Namer.GetName(), wrapper_func)
      );

      this.#data.push(main);

      for (const item of target.Body.iterator())
        ComponentStore.Visit(item, new IterateStoreVisitor(target, main_param));

      const start_store = new StoreStatement(
        target.Location,
        Namer.GetName(),
        target.Over
      );

      return {
        result: new MakeExpression(
          target.Location,
          main.Name,
          new ComponentGroup(
            main_func,
            wrapper_func,
            start_store,
            new AssignStatement(
              target.Location,
              "done",
              new AccessExpression(
                target.Location,
                new ReferenceExpression(
                  target.Location,
                  start_store.Name,
                  start_store
                ),
                "done"
              )
            ),
            new AssignStatement(
              target.Location,
              "next",
              new ReturnStatement(
                target.Location,
                new LambdaExpression(
                  target.Location,
                  new ComponentGroup(),
                  new ComponentGroup(
                    new InvokationExpression(
                      target.Location,
                      wrapper_reference,
                      new ComponentGroup(
                        new InvokationExpression(
                          target.Location,
                          new AccessExpression(
                            target.Location,
                            new ReferenceExpression(
                              target.Location,
                              start_store.Name,
                              start_store
                            ),
                            "next"
                          ),
                          new ComponentGroup()
                        )
                      )
                    )
                  )
                )
              )
            )
          ),
          main
        ),
        cleanup: () => {},
      };
    }

    throw new LinkerError(
      target.Location,
      "Component is not a recognised type"
    );
  }
}
