import { WriterProperty } from "../writer/entity";
import { WriterFile } from "../writer/file";
import { LinkedProperty } from "./property";

export class LinkedPropertyCollection {
  readonly #components: Array<LinkedProperty>;

  constructor(...components: Array<LinkedProperty>) {
    this.#components = components;
  }

  get Keys() {
    return this.#components.map((c) => c.Name);
  }

  GetKey(name: string) {
    return this.#components.find((c) => c.Name === name);
  }

  Build(file: WriterFile): [WriterFile, Array<WriterProperty>] {
    return this.#components.reduce(
      ([cf, cp], n) => {
        const [f, p] = n.Build(cf);
        return [f, [...cp, p]];
      },
      [file, []] as [WriterFile, Array<WriterProperty>]
    );
  }
}
