import Project from "./app/project";
import { Dto } from "./app/dtos";
import Workspace from "./app/workspace";

export async function Compile(root_dir: string, options: Dto.Options = {}) {
  const project = new Project(root_dir);
  await project.Compile(process.platform, options);
}

export async function CompileWorkspace(
  root_dir: string,
  options: Dto.Options = {}
) {
  const project = new Workspace(root_dir);
  await project.Compile(process.platform, options);
}
