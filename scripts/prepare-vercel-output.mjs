import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("apps/media-demo/dist");
const destination = resolve("dist");

if (!existsSync(source)) {
  throw new Error(`Expected Vite output at ${source}`);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });

// The Vercel project may have routing settings that take precedence over SPA
// rewrites. Copy the entry point to concrete documentation paths so these
// pages work as static routes as well.
for (const route of ["sdk", "components"]) {
  const docsDestination = resolve(destination, "docs", route);
  mkdirSync(docsDestination, { recursive: true });
  cpSync(resolve(destination, "index.html"), resolve(docsDestination, "index.html"));
}
