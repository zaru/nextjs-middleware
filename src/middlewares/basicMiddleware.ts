import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

async function heavyTask() {
  console.log("start heavyTask.", new Date());
  // await fetch("http://0.0.0.0:9999/heavy.php", { cache: "no-store" });
  console.log("done heavyTask.", new Date());
}

function checkIpRestriction(request: NextRequest) {
  console.log("checkIpRestriction called");
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "";
  // const ok = "120.0.0.1";
  const ok = "::1";
  return ip !== ok;
}

function verifyBasicAuth(request: NextRequest) {
  console.log("verifyBasicAuth called");
  const basicAuth = request.headers.get("authorization");
  if (!basicAuth) return false;

  const authValue = basicAuth.split(" ")[1];
  const [user, password] = atob(authValue).split(":");
  return user === "username" && password === "password";
}

function requireBasicAuth() {
  return NextResponse.json(
    { error: "Please enter credentials" },
    {
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      status: 401,
    },
  );
}

function verifyToken(request: NextRequest) {
  console.log("verifyToken called");
  const basicAuth = request.headers.get("authorization");
  if (!basicAuth) return false;

  const token = basicAuth.split(" ")[1];
  return token === `Bearer ${process.env.AUTH_TOKEN}`;
}

function requireToken() {
  return NextResponse.json(
    { error: "Please enter credentials" },
    {
      status: 401,
    },
  );
}

function redirectAccountsPath(request: NextRequest) {
  const { pathname } = new URL(request.url);
  return NextResponse.redirect(
    new URL(pathname.replace("/accounts/", "/users/"), request.url),
  );
}

function setCacheControl(response: NextResponse) {
  response.headers.set(
    "cache-control",
    "s-maxage=86400, stale-while-revalidate",
  );
}

function splitResponse(
  request: NextRequest,
  cookieKey: string,
  pattern: string[],
) {
  const selectPath =
    request.cookies.get(cookieKey)?.value ||
    pattern[Math.floor(Math.random() * pattern.length)];
  const response = NextResponse.rewrite(new URL(selectPath, request.url));
  response.cookies.set(cookieKey, selectPath);
  return response;
}

export async function basicMiddleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const response = NextResponse.next();
  const { pathname } = new URL(request.url);
  console.log("Middleware called", request.method, pathname);

  // IP制限
  if (checkIpRestriction(request)) {
    return NextResponse.json("", { status: 403 });
  }

  // Auth0認証
  if (/^\/auth0(\/|$)/.test(pathname)) {
    return withMiddlewareAuthRequired()(request, event);
  }

  // BASIC認証
  if (/^\/basic-auth(\/|$)/.test(pathname) && !verifyBasicAuth(request)) {
    return requireBasicAuth();
  }

  // トークン認証
  if (/^\/token-auth(\/|$)/.test(pathname) && !verifyToken(request)) {
    return requireToken();
  }

  // Redirect
  if (/^\/accounts(\/|$)/.test(pathname)) {
    return redirectAccountsPath(request);
  }

  // 任意のCache-Controlを設定
  if (/^\/users(\/|$)/.test(pathname)) {
    setCacheControl(response);
  }

  // A/Bテスト
  if (pathname === "/ab") {
    const pattern = ["/ab", "/ab/pattern-b"];
    return splitResponse(request, "ab", pattern);
  }

  event.waitUntil(heavyTask());

  return response;
}
