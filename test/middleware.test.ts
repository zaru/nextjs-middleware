import type { NextFetchEvent } from "next/dist/server/web/spec-extension/fetch-event";
import { NextMiddlewareResult } from "next/dist/server/web/types";
import { type NextMiddleware, NextRequest } from "next/server";
import { expect, test, vi } from "vitest";
import { middlewareHigherA } from "../src/middleware";

// test("adds 1 + 2 to equal 3", () => {
//   const request = new NextRequest("http://localhost:3000/");
//   const consoleSpy = vi.spyOn(console, "log");
//   middlewareA(request);
//   expect(consoleSpy).toHaveBeenCalledWith("Middleware A called");
//   consoleSpy.mockRestore();
// });

test("adds 1 + 2 to equal 3", async () => {
  const request = new NextRequest("http://localhost:3000/");
  const response = await middlewareHigherA(() => {})(
    request,
    {} as NextFetchEvent,
  );
  expect(response?.status).toBe(401);
  expect(JSON.parse((await response?.text()) || "{}")).toStrictEqual({
    success: false,
    message: "authentication failed",
  });
});
test("adds 1 + 2 to equal 3", async () => {
  const request = new NextRequest("http://localhost:3000/", {
    headers: { Authorization: "Bearer secret" },
  });
  const response = await middlewareHigherA(() => {})(
    request,
    {} as NextFetchEvent,
  );
  console.log("a", response);
});
