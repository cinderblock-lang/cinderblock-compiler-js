import { WriterProperty } from "../writer/entity";
import { WriterFile } from "../writer/file";
import { LinkedParameter } from "./parameter";

export class LinkedParameterCollection {
  readonly #components: Array<LinkedParameter>;

  constructor(...components: Array<LinkedParameter>) {
    this.#components = components;
  }

  get Keys() {
    return this.#components.map((c) => c.Name);
  }

  GetKey(name: string) {
    return this.#components.find((c) => c.Name === name);
  }

  Remaining(offset: number) {
    return this.#components.slice(offset);
  }

  Build(
    file: WriterFile,
    preserve_name = false
  ): [WriterFile, Array<WriterProperty>] {
    return this.#components.reduce(
      ([cf, cp], n) => {
        const [f, p] = n.Build(cf, preserve_name);
        return [f, [...cp, p]];
      },
      [file, []] as [WriterFile, Array<WriterProperty>]
    );
  }
}
