import { Dto } from "./dtos";
import Library from "./library";
import Fs from "fs/promises";
import FsOld from "fs";
import Path from "path";
import { CodeBase } from "../ast/code-base";
import Source from "./source";
import Gcc from "./gcc";
import { ParserError } from "../parser/error";
import { LinkerError } from "../linker/error";
import { WriterFile } from "../writer/file";
import { UninitialisedError } from "../linker/uninitialised-error";

export default class Project {
  readonly #dir: string;
  readonly #dto: Dto.Project;

  constructor(dir: string) {
    const path = Path.resolve(dir, "cinder.json");
    this.#dir = dir;
    const result = Dto.Project.safeParse(
      JSON.parse(FsOld.readFileSync(path, "utf-8"))
    );

    if (!result.success) throw new Error("Could not parse project JSON");

    this.#dto = result.data;
  }

  async #ensure_dir(path: string) {
    try {
      await Fs.mkdir(path, { recursive: true });
    } catch {}
  }

  get #source(): Source {
    return new Source(this.#dto.files, this.#dir);
  }

  get #libraries() {
    const cache_dir = Path.resolve(this.#dir, ".cinder_cache");
    return (this.#dto.libs ?? [])
      .concat(
        !this.#dto.no_std
          ? [
              `https://raw.githubusercontent.com/cinderblock-lang/cinderblock-std/${
                this.#dto.std_tag ?? "master"
              }`,
            ]
          : []
      )
      .map((l) => new Library(this.#dir, l, cache_dir));
  }

  async #ensure_libraries(no_cache?: boolean) {
    for (const lib of this.#libraries) {
      await lib.EnsureCloned(no_cache);
    }
  }

  async #parse(target: Dto.Target, no_cache?: boolean) {
    await this.#ensure_libraries(no_cache);

    let parsed = new CodeBase();

    for (const library of this.#libraries) {
      const source = await library.GetSource();

      for (const file of source.Files(target))
        parsed = await file.GetAst(parsed);
    }

    for (const file of this.#source.Files(target))
      parsed = await file.GetAst(parsed);

    return parsed;
  }

  async Compile(target: Dto.Target, options: Dto.Options) {
    try {
      const ast = await this.#parse(target, options.no_cache);

      const dir = Path.resolve(this.#dir, this.#dto.bin, target);
      await this.#ensure_dir(dir);
      const writer_file = new WriterFile([], []);
      const [writer] = ast.Linked.Declare(writer_file);
      await Fs.writeFile(Path.resolve(dir, "main.c"), writer.C);

      const gcc = new Gcc(dir, target);
      await gcc.Compile("main.c", this.#dto.name, options.debug ?? false);
    } catch (err: unknown) {
      if (err instanceof ParserError) {
        console.log(`Parser Error:\n${err.Location}\n\n${err.Message}`);
        process.exit(1);
      }

      if (err instanceof UninitialisedError) {
        console.log(`Uninitialised Error:\n${err.Location}\n\n${err.Message}`);
        process.exit(1);
      }

      if (err instanceof LinkerError) {
        console.log(
          `Linker Error:\n${err.Location}\nSeverity: ${err.Severity}\n\n${err.Message}`
        );
        process.exit(1);
      }

      throw err;
    }
  }
}
