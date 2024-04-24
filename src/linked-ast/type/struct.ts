import { CodeLocation } from "../../location/code-location";
import { WriterProperty, WriterStruct } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { WriterStructType, WriterType } from "../../writer/type";
import { LinkedPropertyCollection } from "../property-collection";
import { LinkedType } from "./base";

export class LinkedStructType extends LinkedType {
  readonly #properties: LinkedPropertyCollection;

  constructor(ctx: CodeLocation, properties: LinkedPropertyCollection) {
    super(ctx);
    this.#properties = properties;
  }

  GetKey(name: string) {
    return this.#properties.GetKey(name);
  }

  Build(file: WriterFile): [WriterFile, WriterType] {
    let properties: Array<WriterProperty>;
    [file, properties] = this.#properties.Build(file);
    const result = new WriterStruct(this.CName, properties);

    return [file.WithEntity(result), new WriterStructType(this.CName)];
  }
}
