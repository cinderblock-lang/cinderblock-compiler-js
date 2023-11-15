import Path from "path";
import Fs from "fs/promises";
import Child from "child_process";
import { Ast } from "#compiler/ast";
import { ParseCinderblock } from "./parser";

type Target = "linux" | "macos" | "windows" | "android" | "ios" | "wasm";

type File = string | Partial<Record<Target, string>>;

type Project = {
  files: Array<File>;
  libs?: Array<string>;
  targets: Array<Target>;
  bin: string;
};

type Library = {
  files: Array<File>;
  libs?: Array<string>;
  supported: Target;
};

function Clone(git: string, path: string) {
  return new Promise<void>(async (res, rej) => {
    await Fs.mkdir(path, { recursive: true });

    Child.exec(`git clone ${git} .`, { cwd: path }, (err) =>
      err ? rej(err) : res()
    );
  });
}

function LibraryUrl(cache_dir: string, url: string) {
  const dir = Buffer.from(url).toString("hex");
  return Path.resolve(cache_dir, dir);
}

async function ReadJson(path: string) {
  return JSON.parse(await Fs.readFile(path, "utf-8"));
}

async function ReadText(path: string) {
  return await Fs.readFile(path, "utf-8");
}

export async function Compile(root_dir: string) {
  const project: Project = await ReadJson(
    Path.resolve(root_dir, "cinder.json")
  );

  const cache_dir = Path.resolve(root_dir, ".cinder_cache");

  for (const url of project.libs ?? []) {
    const path = LibraryUrl(cache_dir, url);
    try {
      const stat = await Fs.stat(path);
      if (!stat.isDirectory()) throw new Error("Not found");

      console.log(`Using cache for ${url}`);
    } catch {
      console.log(`Could not use cache for ${url}, pulling from remote`);

      await Clone(url, path);
    }
  }

  let result = new Ast();

  for (const target of project.targets) {
    for (const url of project.libs ?? []) {
      const path = LibraryUrl(cache_dir, url);

      const library_project: Library = await ReadJson(path);

      if (!library_project.supported.includes(target))
        throw new Error(`Library ${url} does not support target ${target}`);

      for (const file of library_project.files) {
        if (typeof file === "string") {
          result = result.with(
            ParseCinderblock(
              await ReadText(Path.resolve(path, file)),
              Path.resolve(path, file)
            )
          );
        } else {
          const targeted = file[target];
          if (targeted)
            result = result.with(
              ParseCinderblock(
                await ReadText(Path.resolve(path, targeted)),
                Path.resolve(path, targeted)
              )
            );
        }
      }
    }

    for (const file of project.files) {
      if (typeof file === "string") {
        result = result.with(
          ParseCinderblock(
            await ReadText(Path.resolve(root_dir, file)),
            Path.resolve(root_dir, file)
          )
        );
      } else {
        const targeted = file[target];
        if (targeted)
          result = result.with(
            ParseCinderblock(
              await ReadText(Path.resolve(root_dir, targeted)),
              Path.resolve(root_dir, targeted)
            )
          );
      }
    }
  }
}
