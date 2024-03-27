import { describe, expect, spyOn, test } from "bun:test";
import { middleware } from "@/middlewares/hofMiddleware";
import { sleep } from "bun";
import { FetchEvent } from "next/dist/compiled/@edge-runtime/primitives";
import { type NextFetchEvent, NextRequest } from "next/server";
import { encryptedCookie } from "./utils/auth0_cookie";

const spy = spyOn(console, "log");
describe("Restrict IP", () => {
  test("Deny IP", async () => {
    const request = new NextRequest("http://localhost:3000/");
    const event = new FetchEvent(request);
    const response = await middleware(
      request,
      event as unknown as NextFetchEvent,
    );
    expect(response?.ok).toBe(false);
    expect(response?.status).toBe(403);
    await sleep(1000);
    expect(spy.mock.calls.flat()).toContain("Higher Middleware heavyTask done");
  });

  test("Allow IP", async () => {
    const request = new NextRequest(
      new Request("http://localhost:3000/users/100", {
        headers: {
          method: "GET",
          "x-forwarded-for": "::1",
        },
      }),
    );
    const event = new FetchEvent(request);
    const response = await middleware(
      request,
      event as unknown as NextFetchEvent,
    );
    expect(response?.ok).toBe(true);
    expect(response?.status).toBe(200);
  });
});

describe("Auth0", () => {
  test("Deny", async () => {
    const request = new NextRequest("http://localhost:3000/auth0");
    const event = new FetchEvent(request);
    const response = await middleware(
      request,
      event as unknown as NextFetchEvent,
    );
    expect(response?.ok).toBe(false);
    expect(response?.headers.get("location")).toInclude("/api/auth/login");
    expect(response?.status).toBe(307);
  });
  test("Logged in", async () => {
    const dummyJwt = await encryptedCookie(
      "test user",
      "user@example.com",
      "dummy|1234",
    );
    const request = new NextRequest("http://localhost:3000/auth0", {
      headers: {
        cookie: `appSession=${dummyJwt};`,
      },
    });
    const event = new FetchEvent(request);
    const response = await middleware(
      request,
      event as unknown as NextFetchEvent,
    );
    expect(response?.ok).toBe(true);
    expect(response?.status).toBe(200);
  });
});
