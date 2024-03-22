import {
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from "next/server";

import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";

type MiddlewareFactory = (middleware: NextMiddleware) => NextMiddleware;
export function chain(
  functions: MiddlewareFactory[],
  index = 0,
): NextMiddleware {
  const current = functions[index];

  if (current) {
    const next = chain(functions, index + 1);
    return current(next);
  }

  return () => {
    console.log("chain end, return NextResponse.next()");
    return NextResponse.next();
  };
}

function restrictIp(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    console.log("Higher Middleware restrictIp called");
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "";
    // const ok = "120.0.0.1";
    const ok = "::1";
    if (ip !== ok) {
      return NextResponse.json("", { status: 403 });
    }
    return middleware(request, event);
  };
}

function requireBasicAuth(middleware: NextMiddleware) {
  const responseBasicAuth = NextResponse.json(
    { error: "Please enter credentials" },
    {
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      status: 401,
    },
  );

  return async (request: NextRequest, event: NextFetchEvent) => {
    const { pathname } = new URL(request.url);
    if (/^\/basic-auth(\/|$)/.test(pathname)) {
      console.log("Higher Middleware requireBasicAuth called");
      const basicAuth = request.headers.get("authorization");
      if (!basicAuth) {
        return responseBasicAuth;
      }

      const authValue = basicAuth.split(" ")[1];
      const [user, password] = atob(authValue).split(":");
      if (user !== "username" || password !== "password") {
        return responseBasicAuth;
      }
    } else {
      console.log("Higher Middleware requireBasicAuth skipped");
    }
    return middleware(request, event);
  };
}

function requireToken(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const { pathname } = new URL(request.url);
    if (/^\/token-auth(\/|$)/.test(pathname)) {
      console.log("Higher Middleware requireToken called");
      const token = request.headers.get("Authorization");
      if (!token || token !== `Bearer ${process.env.AUTH_TOKEN}`) {
        return NextResponse.json(
          { error: "Please enter credentials" },
          { status: 401 },
        );
      }
    } else {
      console.log("Higher Middleware requireToken called");
    }
    return middleware(request, event);
  };
}

function redirectAccountsPath(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const { pathname } = new URL(request.url);
    if (/^\/accounts(\/|$)/.test(pathname)) {
      console.log("Higher Middleware redirectAccountsPath called");
      return NextResponse.redirect(
        new URL(pathname.replace("/accounts/", "/users/"), request.url),
      );
    }
    console.log("Higher Middleware redirectAccountsPath skipped");
    return middleware(request, event);
  };
}

function setCacheControl(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const { pathname } = new URL(request.url);
    if (/^\/users(\/|$)/.test(pathname)) {
      console.log("Higher Middleware setCacheControl called");
      // 通常版と比較すると、この時点でResponse返しちゃうので後続の処理はされない点が違う
      const response = NextResponse.next();
      response.headers.set(
        "cache-control",
        "s-maxage=86400, stale-while-revalidate",
      );
      return response;
    }
    console.log("Higher Middleware setCacheControl skipped");
    return middleware(request, event);
  };
}

function abTest(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const { pathname } = new URL(request.url);
    if (pathname === "/ab") {
      console.log("Higher Middleware abTest called");
      const cookieKey = "ab";
      const pattern = ["/ab", "/ab/pattern-b"];
      const selectPath =
        request.cookies.get(cookieKey)?.value ||
        pattern[Math.floor(Math.random() * pattern.length)];
      const response = NextResponse.rewrite(new URL(selectPath, request.url));
      response.cookies.set(cookieKey, selectPath);
      return response;
    }
    console.log("Higher Middleware abTest skipped");
    return middleware(request, event);
  };
}

function requireAuth0(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const { pathname } = new URL(request.url);
    if (/^\/auth0(\/|$)/.test(pathname)) {
      return withMiddlewareAuthRequired()(request, event);
    }
    return middleware(request, event);
  };
}

function heavyTask(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    console.log("Higher Middleware heavyTask called");
    const task = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Higher Middleware heavyTask done");
    };
    event.waitUntil(task());
    return middleware(request, event);
  };
}

export const middleware = chain([
  heavyTask,
  requireAuth0,
  restrictIp,
  requireBasicAuth,
  requireToken,
  redirectAccountsPath,
  setCacheControl,
  abTest,
]);
