import { FunctionEntity } from "./entity/function";
import { Expression } from "./expression/base";
import { LambdaExpression } from "./expression/lambda";

class Invokation {
  readonly #subject: FunctionEntity | LambdaExpression;
  readonly #argument: Array<Expression>;

  constructor(
    subject: FunctionEntity | LambdaExpression,
    args: Array<Expression>
  ) {
    this.#subject = subject;
    this.#argument = args;
  }
}

export class CallStack {
  readonly #invokations: Array<Invokation>;
  readonly #staged_arguments: Array<Expression>;
  readonly #current_parameter_index: number;

  constructor(
    invokations: Array<Invokation>,
    staged_arguments: Array<Expression>,
    current_parameter_index: number
  ) {
    this.#invokations = invokations;
    this.#staged_arguments = staged_arguments;
    this.#current_parameter_index = current_parameter_index;
  }

  PrepareInvokation(args: Array<Expression>) {
    return new CallStack(
      this.#invokations,
      args,
      this.#current_parameter_index
    );
  }

  EnterFunction(self: FunctionEntity | LambdaExpression) {
    return new CallStack(
      [...this.#invokations, new Invokation(self, this.#staged_arguments)],
      [],
      this.#current_parameter_index
    );
  }

  WithParameterIndex(index: number) {
    return new CallStack(this.#invokations, this.#staged_arguments, index);
  }
}
