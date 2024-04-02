import z from "zod";

export namespace Dto {
  export const Target = z.union([
    z.literal("aix"),
    z.literal("android"),
    z.literal("darwin"),
    z.literal("freebsd"),
    z.literal("haiku"),
    z.literal("linux"),
    z.literal("openbsd"),
    z.literal("sunos"),
    z.literal("win32"),
    z.literal("cygwin"),
    z.literal("netbsd"),
  ]);

  export type Target = z.infer<typeof Target>;

  export const CFunction = z.object({
    c_name: z.string(),
    namespace: z.string(),
    args: z.array(z.string()),
    returns: z.string(),
  });

  export type CFunction = z.infer<typeof CFunction>;

  export const CStruct = z.record(z.string());

  export type CStruct = z.infer<typeof CStruct>;

  export const CFile = z.object({
    type: z.literal("c"),
    path: z.string(),
    functions: z.record(CFunction),
    structs: z.optional(z.record(CStruct)),
  });

  export type CFile = z.infer<typeof CFile>;

  export const CinderBlockFile = z.string();

  export type CinderBlockFile = z.infer<typeof CinderBlockFile>;

  export const File = z.union([CFile, CinderBlockFile]);

  export type File = z.infer<typeof File>;

  export const Source = z.union([File, z.record(Target, File)]);

  export type Source = z.infer<typeof Source>;

  export const Project = z.object({
    name: z.string(),
    files: z.array(Source),
    libs: z.optional(z.array(z.string())),
    bin: z.string(),
    std_tag: z.optional(z.string()),
    no_std: z.optional(z.boolean()),
  });

  export type Project = z.infer<typeof Project>;

  export const Library = z.object({
    files: z.array(Source),
    libs: z.optional(z.array(z.string())),
  });

  export type Library = z.infer<typeof Library>;

  export type Options = { debug?: boolean; no_cache?: boolean };
}
