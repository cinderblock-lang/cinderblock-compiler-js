import assert from "node:assert";
import { Parameter } from "../ast/parameter";
import { Type } from "../ast/type/base";
import { Property } from "../ast/property";
import { ParameterCollection } from "../ast/parameter-collection";
import { Statement } from "../ast/statement/base";
import { Block } from "../ast/block";

type ParameterSpec = {
  name: string;
  optional: boolean;
  tester: (type: Type) => void;
};

type StatementSpec<T extends Statement> = {
  type: new (...args: any) => T;
  tester: (statement: T) => void;
};

export default class AssertExtra {
  static InstanceOf<T extends new (...args: Array<any>) => any>(
    subject: unknown,
    expected: T
  ): asserts subject is InstanceType<T> {
    if (!(subject instanceof expected))
      throw new Error("Expected subject to be instance of " + expected.name);
  }

  static ParametersWith(subject: any, spec: Array<ParameterSpec>) {
    AssertExtra.InstanceOf(subject, ParameterCollection);
    const parameters = subject.Parameters;
    if (parameters.length !== spec.length)
      throw new Error("Wrong parameters length");
    for (let i = 0; i < spec.length; i++) {
      const parameter = parameters[i];
      const { name, optional, tester } = spec[i];

      AssertExtra.InstanceOf(parameter, Parameter);
      assert.equal(parameter.Name, name);
      assert.equal(parameter.Optional, optional);
      tester(parameter.Type);
    }
  }

  static BlockWith<TSpec extends Array<Statement>>(
    subject: any,
    spec: {
      [TKey in keyof TSpec]: StatementSpec<TSpec[TKey]>;
    }
  ) {
    AssertExtra.InstanceOf(subject, Block);
    const statements = subject.Statements;
    if (statements.length !== spec.length)
      throw new Error("Wrong statments length");
    for (let i = 0; i < spec.length; i++) {
      const statement = statements[i];
      const { type, tester } = spec[i];

      AssertExtra.InstanceOf(statement, type);
      tester(statement);
    }
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
