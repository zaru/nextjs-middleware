import { describe, expect, spyOn, test } from "bun:test";
import { middleware } from "@/middlewares/hofMiddleware";
import { sleep } from "bun";
import { FetchEvent } from "next/dist/compiled/@edge-runtime/primitives";
import { type NextFetchEvent, NextRequest } from "next/server";
import { encryptedCookie } from "./utils/auth0_cookie";

const spy = spyOn(console, "log");

describe("Heavy task", () => {
  test("Done task", async () => {
    const request = new NextRequest("http://localhost:3000/");
    const event = new FetchEvent(request);
    const response = await middleware(
      request,
      event as unknown as NextFetchEvent,
    );
    expect(response?.ok).toBe(true);
    await sleep(1100);
    expect(spy.mock.calls.flat()).toContain("Higher Middleware heavyTask done");
  });
});

describe("Restrict IP", () => {
  test("Deny IP", async () => {
    const request = new NextRequest("http://localhost:3000/restrict-ip");
    const event = new FetchEvent(request);
    const response = await middleware(
      request,
      event as unknown as NextFetchEvent,
    );
    expect(response?.ok).toBe(false);
    expect(response?.status).toBe(403);
  });

  test("Allow IP", async () => {
    const request = new NextRequest("http://localhost:3000/restrict-ip", {
      headers: {
        "x-forwarded-for": "::1",
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

describe("Redirect path", () => {
  test("/accounts to /users", async () => {
    const request = new NextRequest("http://localhost:3000/accounts/100");
    const event = new FetchEvent(request);
    const response = await middleware(
      request,
      event as unknown as NextFetchEvent,
    );
    expect(response?.ok).toBe(false);
    expect(response?.headers.get("location")).toInclude("/users/100");
    expect(response?.status).toBe(307);
  });
});
