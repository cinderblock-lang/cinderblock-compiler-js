import Project from "./app/project";
import { Dto } from "./app/dtos";

export async function Compile(root_dir: string, options: Dto.Options = {}) {
  const project = new Project(root_dir);
  await project.Compile(process.platform, options);
}
