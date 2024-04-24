import { WriterFunction } from "../../writer/entity";
import { WriterFile } from "../../writer/file";
import { WriterStatement } from "../../writer/statement";
import { LinkedComponent } from "../component";

export abstract class LinkedStatement extends LinkedComponent {
  abstract Build(
    file: WriterFile,
    func: WriterFunction
  ): [WriterFile, WriterFunction, WriterStatement];
}
