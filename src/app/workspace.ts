import { Dto } from "./dtos";
import FsOld from "fs";
import Path from "path";
import Project from "./project";

export default class Workspace {
  readonly #dir: string;
  readonly #dto: Dto.Workspace;

  constructor(dir: string) {
    const path = Path.resolve(dir, "cinder-workspace.json");
    this.#dir = dir;
    const result = Dto.Workspace.safeParse(
      JSON.parse(FsOld.readFileSync(path, "utf-8"))
    );

    if (!result.success) throw new Error("Could not parse project JSON");

    this.#dto = result.data;
  }

  async Compile(target: Dto.Target, options: Dto.Options) {
    for (const project of this.#dto.projects.filter((p) => p.type === "app"))
      await new Project(Path.resolve(this.#dir, project.path)).Compile(
        target,
        options
      );
  }
}
