import Path from "path";
import Fs from "fs/promises";
import Child from "child_process";
import { Ast } from "#compiler/ast";
import { ParseCinderblock } from "./parser";
import { LinkCinderblock } from "./linker";
import { WriteCinderblock } from "./writer";

type Target = "linux" | "macos" | "windows" | "android" | "ios" | "wasm";

type File = string | Partial<Record<Target, string>>;

type Project = {
  name: string;
  files: Array<File>;
  libs?: Array<[string, string]>;
  targets: Array<Target>;
  bin: string;
  std_tag?: string;
};

type Library = {
  files: Array<File>;
  libs?: Array<string>;
  supported: Target;
};

function Exec(command: string, cwd: string) {
  return new Promise<void>(async (res, rej) => {
    Child.exec(command, { cwd }, (err) => (err ? rej(err) : res()));
  });
}

async function Clone(git: string, version: string, path: string) {
  await Fs.mkdir(path, { recursive: true });

  await Exec(
    `git clone --depth=1 ${
      version !== "*" ? `--branch ${version}` : ""
    } ${git} .`,
    path
  );
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

  const libs = (project.libs ?? []).concat([
    "https://github.com/cinderblock-lang/cinderblock-std.git",
    project.std_tag ?? "*",
  ]);

  for (const [url, tag] of libs) {
    const path = LibraryUrl(cache_dir, url);
    try {
      const stat = await Fs.stat(path);
      if (!stat.isDirectory()) throw new Error("Not found");

      console.log(`Using cache for ${url}`);
    } catch {
      console.log(`Could not use cache for ${url}, pulling from remote`);

      await Clone(url, tag, path);
    }
  }

  for (const target of project.targets) {
    let parsed = new Ast();

    for (const [url] of libs) {
      const path = LibraryUrl(cache_dir, url);

      const library_project: Library = await ReadJson(
        Path.join(path, "cinder.json")
      );

      if (!library_project.supported.includes(target))
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

    const linked = LinkCinderblock(parsed);

    const c_code = WriteCinderblock(linked);

    const dir = Path.resolve(root_dir, project.bin, target);
    await Fs.mkdir(dir, { recursive: true });

    await Fs.writeFile(Path.join(dir, "main.c"), c_code);

    switch (target) {
      case "linux":
        await Exec(`gcc main.c -o ${project.name}`, dir);
      default:
        throw new Error(
          "Currently, only compiling for linux on linux is supported. Expect more when the compiler is written in cinderblock"
        );
    }
  }
}
