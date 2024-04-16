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

  WithInclude(include: string) {
    return new WriterFile(
      [...this.#includes, include].filter((e, i, a) => a.indexOf(e) === i),
      this.#entities
    );
  }

  get C(): string {
    const includes = this.#includes.map((i) => `#include ${i}`).join("\n");
    const entities = this.#entities.map((e) => e.Declaration).join("\n\n");
    return `${includes}\n\n${entities}`;
  }
}
