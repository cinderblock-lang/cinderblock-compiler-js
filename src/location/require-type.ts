import { Component } from "../ast/component";
import { LinkerError } from "../linker/error";

export function RequireType<T extends Component>(
  target: abstract new (...args: Array<any>) => T,
  item: Component
): asserts item is T {
  if (!(item instanceof target)) {
    throw new LinkerError(
      item.CodeLocation,
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
    item.CodeLocation,
    `Invalid type. Expected one of several types but recieved ${item.constructor.name}`
  );
}
