import {
  AccessExpression,
  AssignStatement,
  Component,
  ComponentGroup,
  ComponentStore,
  FunctionParameter,
  FunctionType,
  IfExpression,
  InvokationExpression,
  LambdaExpression,
  LiteralExpression,
  MakeExpression,
  Namespace,
  OperatorExpression,
  PanicStatement,
  PrimitiveType,
  Property,
  ReferenceExpression,
  ReferenceType,
  ReturnStatement,
  StoreStatement,
  StructEntity,
  Visitor,
} from "#compiler/ast";
import { PatternMatch, Location, Namer } from "#compiler/location";
import { ResolveExpression } from "./resolve";

const EmptyLocation = new Location("generated", -1, -1, -1, -1);

export class ConcatVisitor extends Visitor {
  #data: Array<StructEntity> = [];

  get Namespace() {
    return new Namespace(
      EmptyLocation,
      false,
      "__Compiled__Code__",
      new ComponentGroup(...this.#data)
    );
  }

  constructor() {
    super();
  }

  get OperatesOn(): (new (...args: any[]) => Component)[] {
    return [OperatorExpression];
  }

  Visit(target: Component) {
    return PatternMatch(OperatorExpression)((operator) => {
      if (operator.Operator !== "++")
        return { result: undefined, cleanup: () => {} };

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
            ResolveExpression(operator.Left),
            true
          )
        )
      );

      const wrapper_param1 = new FunctionParameter(
        target.Location,
        Namer.GetName(),
        ResolveExpression(operator.Left),
        false
      );

      const wrapper_param2 = new FunctionParameter(
        target.Location,
        Namer.GetName(),
        ResolveExpression(operator.Right),
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
          new ComponentGroup(wrapper_param1, wrapper_param2),
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
                    new OperatorExpression(
                      target.Location,
                      new AccessExpression(
                        target.Location,
                        new ReferenceExpression(
                          target.Location,
                          wrapper_param1.Name,
                          wrapper_param1
                        ),
                        "done"
                      ),
                      "||",
                      new AccessExpression(
                        target.Location,
                        new ReferenceExpression(
                          target.Location,
                          wrapper_param2.Name,
                          wrapper_param2
                        ),
                        "done"
                      )
                    )
                  ),
                  new AssignStatement(
                    target.Location,
                    "result",
                    new IfExpression(
                      target.Location,
                      new AccessExpression(
                        target.Location,
                        new ReferenceExpression(
                          target.Location,
                          wrapper_param1.Name,
                          wrapper_param1
                        ),
                        "done"
                      ),
                      new ComponentGroup(
                        new ReturnStatement(
                          target.Location,
                          new IfExpression(
                            target.Location,
                            new AccessExpression(
                              target.Location,
                              new ReferenceExpression(
                                target.Location,
                                wrapper_param2.Name,
                                wrapper_param2
                              ),
                              "done"
                            ),
                            new ComponentGroup(
                              new ReturnStatement(
                                target.Location,
                                new PanicStatement(
                                  target.Location,
                                  new LiteralExpression(
                                    target.Location,
                                    "int",
                                    "89i"
                                  )
                                )
                              )
                            ),
                            new ComponentGroup(
                              new ReturnStatement(
                                target.Location,
                                new AccessExpression(
                                  target.Location,
                                  new ReferenceExpression(
                                    target.Location,
                                    wrapper_param2.Name,
                                    wrapper_param2
                                  ),
                                  "result"
                                )
                              )
                            )
                          )
                        )
                      ),
                      new ComponentGroup(
                        new ReturnStatement(
                          target.Location,
                          new AccessExpression(
                            target.Location,
                            new ReferenceExpression(
                              target.Location,
                              wrapper_param1.Name,
                              wrapper_param1
                            ),
                            "result"
                          )
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
                          new IfExpression(
                            target.Location,
                            new AccessExpression(
                              target.Location,
                              new ReferenceExpression(
                                target.Location,
                                wrapper_param1.Name,
                                wrapper_param1
                              ),
                              "done"
                            ),
                            new ComponentGroup(
                              new ReturnStatement(
                                target.Location,
                                new IfExpression(
                                  target.Location,
                                  new AccessExpression(
                                    target.Location,
                                    new ReferenceExpression(
                                      target.Location,
                                      wrapper_param2.Name,
                                      wrapper_param2
                                    ),
                                    "done"
                                  ),
                                  new ComponentGroup(
                                    new ReturnStatement(
                                      target.Location,
                                      new InvokationExpression(
                                        target.Location,
                                        wrapper_reference,
                                        new ComponentGroup(
                                          new ReferenceExpression(
                                            target.Location,
                                            wrapper_param1.Name,
                                            wrapper_param1
                                          ),
                                          new ReferenceExpression(
                                            target.Location,
                                            wrapper_param2.Name,
                                            wrapper_param2
                                          )
                                        )
                                      )
                                    )
                                  ),
                                  new ComponentGroup(
                                    new ReturnStatement(
                                      target.Location,
                                      new InvokationExpression(
                                        target.Location,
                                        wrapper_reference,
                                        new ComponentGroup(
                                          new ReferenceExpression(
                                            target.Location,
                                            wrapper_param1.Name,
                                            wrapper_param1
                                          ),
                                          new InvokationExpression(
                                            target.Location,
                                            new AccessExpression(
                                              target.Location,
                                              new ReferenceExpression(
                                                target.Location,
                                                wrapper_param2.Name,
                                                wrapper_param2
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
                                          wrapper_param1.Name,
                                          wrapper_param1
                                        ),
                                        "next"
                                      ),
                                      new ComponentGroup()
                                    ),
                                    new ReferenceExpression(
                                      target.Location,
                                      wrapper_param2.Name,
                                      wrapper_param2
                                    )
                                  )
                                )
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
          new ComponentGroup(wrapper_param1, wrapper_param2),
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
      const start_store1 = new StoreStatement(
        target.Location,
        Namer.GetName(),
        operator.Left
      );
      const start_store2 = new StoreStatement(
        target.Location,
        Namer.GetName(),
        operator.Right
      );

      return {
        result: new MakeExpression(
          target.Location,
          main.Name,
          new ComponentGroup(
            start_store1,
            start_store2,
            wrapper_func,
            new AssignStatement(
              target.Location,
              "done",
              new OperatorExpression(
                target.Location,
                new AccessExpression(
                  target.Location,
                  new ReferenceExpression(
                    target.Location,
                    start_store1.Name,
                    start_store1
                  ),
                  "done"
                ),
                "||",
                new AccessExpression(
                  target.Location,
                  new ReferenceExpression(
                    target.Location,
                    start_store2.Name,
                    start_store2
                  ),
                  "done"
                )
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
                    new ReturnStatement(
                      target.Location,
                      new IfExpression(
                        target.Location,
                        new AccessExpression(
                          target.Location,
                          new ReferenceExpression(
                            target.Location,
                            wrapper_param1.Name,
                            wrapper_param1
                          ),
                          "done"
                        ),
                        new ComponentGroup(
                          new ReturnStatement(
                            target.Location,
                            new IfExpression(
                              target.Location,
                              new AccessExpression(
                                target.Location,
                                new ReferenceExpression(
                                  target.Location,
                                  wrapper_param2.Name,
                                  wrapper_param2
                                ),
                                "done"
                              ),
                              new ComponentGroup(
                                new ReturnStatement(
                                  target.Location,
                                  new InvokationExpression(
                                    target.Location,
                                    wrapper_reference,
                                    new ComponentGroup(
                                      new ReferenceExpression(
                                        target.Location,
                                        wrapper_param1.Name,
                                        wrapper_param1
                                      ),
                                      new ReferenceExpression(
                                        target.Location,
                                        wrapper_param2.Name,
                                        wrapper_param2
                                      )
                                    )
                                  )
                                )
                              ),
                              new ComponentGroup(
                                new ReturnStatement(
                                  target.Location,
                                  new InvokationExpression(
                                    target.Location,
                                    wrapper_reference,
                                    new ComponentGroup(
                                      new ReferenceExpression(
                                        target.Location,
                                        wrapper_param1.Name,
                                        wrapper_param1
                                      ),
                                      new InvokationExpression(
                                        target.Location,
                                        new AccessExpression(
                                          target.Location,
                                          new ReferenceExpression(
                                            target.Location,
                                            wrapper_param2.Name,
                                            wrapper_param2
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
                                      wrapper_param1.Name,
                                      wrapper_param1
                                    ),
                                    "next"
                                  ),
                                  new ComponentGroup()
                                ),
                                new ReferenceExpression(
                                  target.Location,
                                  wrapper_param2.Name,
                                  wrapper_param2
                                )
                              )
                            )
                          )
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
    })(target);
  }
}
