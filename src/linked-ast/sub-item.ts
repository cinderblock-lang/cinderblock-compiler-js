import { CodeLocation } from "../location/code-location";
import { WriterProperty } from "../writer/entity";
import { WriterFile } from "../writer/file";
import { WriterType } from "../writer/type";
import { LinkedComponent } from "./component";
import { LinkedType } from "./type/base";

export class LinkedSubItem extends LinkedComponent {
  readonly #name: string;
  readonly #type: LinkedType;

  constructor(ctx: CodeLocation, name: string, type: LinkedType) {
    super(ctx);
    this.#name = name;
    this.#type = type;
  }

  get Name() {
    return this.#name;
  }

  get Type() {
    return this.#type;
  }

  Build(
    file: WriterFile,
    use_cinderblock_name = false
  ): [WriterFile, WriterProperty] {
    let type: WriterType;
    [file, type] = this.#type.Build(file);
    return [
      file,
      new WriterProperty(use_cinderblock_name ? this.Name : this.CName, type),
    ];
  }
}
