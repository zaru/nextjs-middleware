import { beforeAll } from "bun:test";
import { loadEnvConfig } from "@next/env";

beforeAll(() => {
  loadEnvConfig("./");
});
