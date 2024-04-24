import { WriterFunction } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { LinkedComponent } from "../component";
import { LinkedType } from "../type/base";

export abstract class LinkedEntity extends LinkedComponent {
  abstract get Type(): LinkedType;

  abstract Declare(file: WriterFile): [WriterFile, WriterFunction];
}
