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

export function RequireType<T extends Component>(
  target: abstract new (...args: Array<any>) => T,
  item: Component
): asserts item is T {
  if (!(item instanceof target)) {
    throw new LinkerError(
      item.Location,
      `Invalid type. Expected ${target.prototype.constructor.name} but recieved ${item.constructor.name}`
    );
  }
}

export function RequireOneOfType<
  T extends Array<abstract new (...args: Array<any>) => Component>
>(targets: T, item: Component): asserts item is InstanceType<T[number]> {
  for (const target of targets)
    if (item instanceof target) {
      return;
    }

  throw new LinkerError(
    item.Location,
    `Invalid type. Expected one of several types but recieved ${item.constructor.name}`
  );
}
