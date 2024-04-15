import { WriterEntity } from "./entity";

export class WriterFile {
  readonly #includes: Array<string>;
  readonly #entities: Array<WriterEntity>;

  constructor(includes: Array<string>, entities: Array<WriterEntity>) {
    this.#includes = includes;
    this.#entities = entities;
  }

  WithEntity(entity: WriterEntity) {
    return new WriterFile(this.#includes, [...this.#entities, entity]);
  }
}
