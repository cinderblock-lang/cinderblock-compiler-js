import { LinkedExpression } from "../linked-ast/expression/base";
import { FunctionEntity } from "./entity/function";
import { LambdaExpression } from "./expression/lambda";

class Invokation {
  readonly #subject: FunctionEntity | LambdaExpression;
  readonly #argument: Array<LinkedExpression>;

  constructor(
    subject: FunctionEntity | LambdaExpression,
    args: Array<LinkedExpression>
  ) {
    this.#subject = subject;
    this.#argument = args;
  }

  GetArgument(index: number): LinkedExpression | undefined {
    return this.#argument[index];
  }
}

export class Callstack {
  readonly #invokations: Array<Invokation>;
  readonly #staged_arguments: Array<LinkedExpression>;
  readonly #current_parameter_index: number;

  constructor(
    invokations: Array<Invokation>,
    staged_arguments: Array<LinkedExpression>,
    current_parameter_index: number
  ) {
    this.#invokations = invokations;
    this.#staged_arguments = staged_arguments;
    this.#current_parameter_index = current_parameter_index;
  }

  PrepareInvokation(args: Array<LinkedExpression>) {
    return new Callstack(
      this.#invokations,
      args,
      this.#current_parameter_index
    );
  }

  EnterFunction(self: FunctionEntity | LambdaExpression) {
    return new Callstack(
      [...this.#invokations, new Invokation(self, this.#staged_arguments)],
      [],
      this.#current_parameter_index
    );
  }

  WithParameterIndex(index: number) {
    return new Callstack(this.#invokations, this.#staged_arguments, index);
  }

  GetCurrentParameter() {
    try {
      return this.#invokations[this.#invokations.length - 1].GetArgument(
        this.#current_parameter_index
      );
    } catch {
      return undefined;
    }
  }
}
