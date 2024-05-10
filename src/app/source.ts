import CinderblockFile from "./cinderblock-file";
import { Dto } from "./dtos";
import EmptyFile from "./empty-file";
import File from "./file";
import Path from "path";

export default class Source {
  readonly #source: Array<Dto.Source>;
  readonly #base_dir: string;
  readonly #display_base: string;

  constructor(
    source: Array<Dto.Source>,
    base_dir: string,
    display_base?: string
  ) {
    this.#source = source;
    this.#base_dir = base_dir;
    this.#display_base = display_base ?? base_dir;
  }

  Files(target: Dto.Target): Array<File> {
    return this.#source.map((f) => {
      if (typeof f === "string")
        return new CinderblockFile(
          Path.resolve(this.#base_dir, f),
          Path.join(this.#display_base, f)
        );

      const result = f[target];
      if (!result) return new EmptyFile();

      return new CinderblockFile(
        Path.resolve(this.#base_dir, result),
        Path.join(this.#display_base, result)
      );
    });
  }
}
