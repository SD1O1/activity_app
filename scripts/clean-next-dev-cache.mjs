import { rmSync } from "node:fs";
import { join } from "node:path";

const devCachePath = join(process.cwd(), ".next", "dev");

rmSync(devCachePath, { recursive: true, force: true });
