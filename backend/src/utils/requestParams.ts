import type { Request } from "express";

export function param(req: Request, name: string): string {
  const value: unknown = req.params[name];

  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];

  return "";
}
