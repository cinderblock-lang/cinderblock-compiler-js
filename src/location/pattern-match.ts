import { Component } from "../ast";
import { LinkerError } from "../linker/error";

export function PatternMatch<
  TOptions extends Array<abstract new (...args: Array<any>) => Component>
>(...options: TOptions) {
  return <TResult>(
    ...handlers: {
      [TKey in keyof TOptions]: (
        input: InstanceType<TOptions[TKey]>
      ) => TResult;
    }
  ) => {
    return (input: Component) => {
      for (let i = 0; i < options.length; i++) {
        const constructor = options[i];
        const handler = handlers[i];
        if (input instanceof constructor) {
          return handler(input);
        }
      }

      throw new LinkerError(
        input.Location,
        `No handler found. This is definitely a bug with the compiler.\nFound: ${input.constructor.name}`
      );
    };
  };
}
