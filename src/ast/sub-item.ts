import { Scope } from "../linker/closure";
import { CodeLocation } from "../location/code-location";
import { WriterProperty } from "../writer/entity";
import { WriterFile } from "../writer/file";
import { WriterType } from "../writer/type";
import { Component, IDiscoverableType } from "./component";
import { Type } from "./type/base";
import { SchemaType } from "./type/schema";
import { UseType } from "./type/use";

export class SubItem extends Component {
  readonly #name: string;
  readonly #type: Type;
  readonly #optional: boolean;

  constructor(ctx: CodeLocation, name: string, type: Type, optional: boolean) {
    super(ctx);
    this.#name = name;
    this.#type = type;
    this.#optional = optional;
  }

  get Name() {
    return this.#name;
  }

  get Type() {
    return this.#type;
  }

  get Optional() {
    return this.#optional;
  }

  DiscoverType(name: string): IDiscoverableType | undefined {
    if (this.Type instanceof UseType && this.Type.Name === name)
      return this.Type;
    if (this.Type instanceof SchemaType)
      return this.Type.Properties.DiscoverType(name);

    return undefined;
  }

  Build(
    file: WriterFile,
    scope: Scope,
    use_cinderblock_name = false
  ): [WriterFile, WriterProperty] {
    let type: WriterType;
    [file, type] = this.#type.Build(file, scope);
    return [
      file,
      new WriterProperty(use_cinderblock_name ? this.Name : this.CName, type),
    ];
  }
}
