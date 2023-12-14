import Path from "path";
import Http from "https";
import FsOld from "fs";
import Fs from "fs/promises";
import Child from "child_process";
import { ParseCinderblock } from "./parser";
import { Ast } from "./ast/ast";
import { BuiltInFunctions } from "./linker/built-in-functions";

type Options = { debug?: boolean; no_cache?: boolean; resources_path: string };

type Target = "linux" | "macos" | "windows" | "android" | "ios" | "wasm";

type File = string | Partial<Record<Target, string>>;

type Project = {
  name: string;
  files: Array<File>;
  libs?: Array<string>;
  targets: Array<Target>;
  bin: string;
  std_tag?: string;
  no_std?: boolean;
};

type Library = {
  files: Array<File>;
  libs?: Array<string>;
  targets: Array<Target>;
};

async function EnsureDir(path: string) {
  try {
    await Fs.mkdir(path, { recursive: true });
  } catch {}
}

function JoinUrl(...parts: Array<string>) {
  let result = "";

  for (const part of parts) {
    if (result && !result.endsWith("/")) result = result + "/";

    if (part.startsWith("/")) result = result + part.replace("/", "");
    else if (part.startsWith("./")) result = result + part.replace("./", "");
    else result = result + part;
  }

  return result;
}

async function GetFile(url: string, path: string) {
  await EnsureDir(Path.dirname(path));
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

function Exec(command: string, cwd: string) {
  return new Promise<void>(async (res, rej) => {
    Child.exec(command, { cwd }, (err) => (err ? rej(err) : res()));
  });
}

async function Clone(url: string, path: string) {
  await EnsureDir(path);

  const file = await GetFile(
    JoinUrl(url, "cinder.json"),
    Path.join(path, "cinder.json")
  );

  const data: Library = JSON.parse(file);

  for (const file of data.files) {
    if (typeof file === "string")
      await GetFile(JoinUrl(url, file), Path.join(path, file));
    else
      for (const key in file)
        await GetFile(
          JoinUrl(url, (file as any)[key]),
          Path.join(path, (file as any)[key])
        );
  }
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

async function Prepare(root_dir: string, options: Options) {
  const project: Project = await ReadJson(
    Path.resolve(root_dir, "cinder.json")
  );

  const cache_dir = Path.resolve(root_dir, ".cinder_cache");

  const libs = (project.libs ?? []).concat(
    !project.no_std
      ? [
          `https://raw.githubusercontent.com/cinderblock-lang/cinderblock-std/${
            project.std_tag ?? "master"
          }`,
        ]
      : []
  );

  for (const url of libs) {
    const path = LibraryUrl(cache_dir, url);
    if (options.no_cache) {
      console.log(`Caches disabled for ${url}, pulling from remote`);

      await Clone(url, path);
      continue;
    }

    try {
      const stat = await Fs.stat(path);
      if (!stat.isDirectory()) throw new Error("Not found");

      console.log(`Using cache for ${url}`);
    } catch {
      console.log(`Could not use cache for ${url}, pulling from remote`);

      await Clone(url, path);
    }
  }

  const result: Partial<Record<Target, [string, Ast]>> = {};

  for (const target of project.targets) {
    let parsed = new Ast().with(BuiltInFunctions);

    for (const url of libs) {
      const path = LibraryUrl(cache_dir, url);

      const library_project: Library = await ReadJson(
        Path.join(path, "cinder.json")
      );

      if (!library_project.targets.includes(target))
        throw new Error(`Library ${url} does not support target ${target}`);

      for (const file of library_project.files) {
        if (typeof file === "string") {
          parsed = parsed.with(
            ParseCinderblock(
              await ReadText(Path.resolve(path, file)),
              Path.resolve(path, file)
            )
          );
        } else {
          const targeted = file[target];
          if (targeted)
            parsed = parsed.with(
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
        parsed = parsed.with(
          ParseCinderblock(
            await ReadText(Path.resolve(root_dir, file)),
            Path.resolve(root_dir, file)
          )
        );
      } else {
        const targeted = file[target];
        if (targeted)
          parsed = parsed.with(
            ParseCinderblock(
              await ReadText(Path.resolve(root_dir, targeted)),
              Path.resolve(root_dir, targeted)
            )
          );
      }
    }
    const dir = Path.resolve(root_dir, project.bin, target);
    await Fs.mkdir(dir, { recursive: true });

    result[target] = [dir, parsed];
  }

  return { result, project };
}

export async function Compile(root_dir: string, options: Options) {
  const { result: prepared, project } = await Prepare(root_dir, options);
  for (const target in prepared) {
    const item = prepared[target as Target];
    if (!item) continue;
    const [dir, parsed] = item;
    const c_code = parsed.c([
      `"${Path.resolve(options.resources_path, "memory.h")}"`,
    ]);

    await Fs.writeFile(Path.join(dir, "main.c"), c_code);

    switch (target) {
      case "linux":
        await Exec(
          `gcc main.c ${Path.resolve(options.resources_path, "memory.c")} ${
            options.debug ? "-g" : ""
          } -o ${project.name}`,
          dir
        );
        break;
      default:
        console.warn(
          "Currently, only linux is supported as a target. Other targets will be ignored."
        );
    }
  }
}

export async function Test(root_dir: string, options: Options) {
  const { result: prepared, project } = await Prepare(root_dir, options);

  for (const target in prepared) {
    const item = prepared[target as Target];
    if (!item) continue;
    const [dir, parsed] = item;
    const c_code = parsed.c_test([
      `"${Path.resolve(options.resources_path, "memory.h")}"`,
    ]);

    await Fs.writeFile(Path.join(dir, "test.c"), c_code);

    switch (target) {
      case "linux":
        await Exec(
          `gcc test.c ${Path.resolve(
            options.resources_path,
            "memory.c"
          )} -g -o ${project.name}_tests`,
          dir
        );
        break;
      default:
        console.warn(
          "Currently, only linux is supported as a target. Other targets will be ignored."
        );
    }
  }
}
