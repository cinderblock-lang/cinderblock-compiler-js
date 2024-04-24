import { WriterFile } from "../../writer/file";
import { WriterType } from "../../writer/type";
import { LinkedComponent } from "../component";

export abstract class LinkedType extends LinkedComponent {
  abstract Build(file: WriterFile): [WriterFile, WriterType];
}
