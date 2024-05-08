import Path from "path";
import Fs from "fs/promises";
import FsOld from "fs";
import Http from "https";
import { Dto } from "./dtos";
import Source from "./source";

export default class Library {
  readonly #project_root: string;
  readonly #url: string;
  readonly #cache_dir: string;

  constructor(project_root: string, url: string, cache_dir: string) {
    this.#project_root = project_root;
    this.#url = url;
    this.#cache_dir = cache_dir;
  }

  async #ensure_dir(path: string) {
    try {
      await Fs.mkdir(path, { recursive: true });
    } catch {}
  }

  #join_url(...parts: Array<string>) {
    let result = "";

    for (const part of parts) {
      if (result && !result.endsWith("/")) result = result + "/";

      if (part.startsWith("/")) result = result + part.replace("/", "");
      else if (part.startsWith("./")) result = result + part.replace("./", "");
      else result = result + part;
    }

    return result;
  }

  async #get_file(url: string, path: string) {
    await this.#ensure_dir(Path.dirname(path));

    if (url.startsWith("file:")) {
      await Fs.copyFile(
        Path.resolve(this.#project_root, url.replace("file:", "")),
        path
      );

      return;
    }

    const stream = FsOld.createWriteStream(path);

    return new Promise<string>((res) => {
      Http.get(url, (response) => {
        response.pipe(stream);

        stream.on("finish", () => {
          stream.close();
          Fs.readFile(path, "utf-8").then((text) => res(text));
        });
      });
    });
  }

  async #config() {
    await this.#ensure_dir(this.#path);

    const file = await this.#get_file(
      this.#join_url(this.#url, "cinder.json"),
      Path.join(this.#path, "cinder.json")
    );

    const result = Dto.Library.safeParse(file);
    if (!result.success)
      throw new Error("Could not parsed library " + this.#url);
    return result.data;
  }

  async #clone() {
    const data = await this.#config();

    for (const file of data.files) {
      if (typeof file === "string")
        await this.#get_file(
          this.#join_url(this.#url, file),
          Path.join(this.#path, file)
        );
      else
        for (const key in file)
          await this.#get_file(
            this.#join_url(this.#url, (file as any)[key]),
            Path.join(this.#path, (file as any)[key])
          );
    }
  }

  get #path() {
    return Path.join(
      this.#cache_dir,
      Buffer.from(this.#url).toString("base64url")
    );
  }

  async EnsureCloned(no_cache?: boolean) {
    if (no_cache) {
      console.log(`Caches disabled for ${this.#url}, pulling from remote`);

      await this.#clone();
      return;
    }

    try {
      const stat = await Fs.stat(this.#path);
      if (!stat.isDirectory()) throw new Error("Not found");

      console.log(`Using cache for ${this.#url}`);
    } catch {
      console.log(`Could not use cache for ${this.#url}, pulling from remote`);

      await this.#clone();
    }
  }

  async GetSource() {
    const data = await this.#config();

    return new Source(data.files, this.#path);
  }
}
