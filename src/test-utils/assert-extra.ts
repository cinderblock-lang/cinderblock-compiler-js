import assert from "node:assert";
import { Parameter } from "../ast/parameter";
import { Type } from "../ast/type/base";
import { Property } from "../ast/property";

export default class AssertExtra {
  static InstanceOf<T extends new (...args: Array<any>) => any>(
    subject: unknown,
    expected: T
  ): asserts subject is InstanceType<T> {
    if (!(subject instanceof expected))
      throw new Error("Expected subject to be instance of " + expected.name);
  }

  static ParameterWith(
    subject: any,
    name: string,
    optional: boolean,
    tester: (type: Type) => void
  ) {
    AssertExtra.InstanceOf(subject, Parameter);
    assert.equal(subject.Name, name);
    assert.equal(subject.Optional, optional);
    tester(subject.Type);
  }

  static PropertyWith(
    subject: any,
    name: string,
    optional: boolean,
    tester: (type: Type) => void
  ) {
    AssertExtra.InstanceOf(subject, Property);
    assert.equal(subject.Name, name);
    assert.equal(subject.Optional, optional);
    tester(subject.Type);
  }
}
