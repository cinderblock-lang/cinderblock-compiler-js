import { Dto } from "./dtos";
import Library from "./library";
import Fs from "fs/promises";
import FsOld from "fs";
import Path from "path";
import { Ast } from "../ast";
import Source from "./source";
import Gcc from "./gcc";

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
      .map((l) => new Library(l, cache_dir));
  }

  async #ensure_libraries(no_cache?: boolean) {
    for (const lib of this.#libraries) {
      await lib.EnsureCloned(no_cache);
    }
  }

  async #parse(target: Dto.Target, no_cache?: boolean) {
    await this.#ensure_libraries(no_cache);

    let parsed = new Ast();

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
    const ast = await this.#parse(target, options.no_cache);

    const dir = Path.resolve(this.#dir, this.#dto.bin, target);
    await this.#ensure_dir(dir);
    await Fs.writeFile(Path.resolve(dir, "main.c"), ast.Writer.C);

    const gcc = new Gcc(dir, target);
    await gcc.Compile("main.c", this.#dto.name, options.debug ?? false);
  }

  async Test(target: Dto.Target) {
    const ast = await this.#parse(target, true);

    const dir = Path.resolve(this.#dir, this.#dto.bin, target);
    await this.#ensure_dir(dir);

    // await Fs.writeFile(Path.resolve(dir, "test.c"), ast.c_test());

    const gcc = new Gcc(dir, target);
    await gcc.Compile("test.c", this.#dto.name + "_tests", true);
  }
}
