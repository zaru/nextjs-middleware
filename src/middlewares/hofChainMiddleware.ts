import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";

// Higher Order Middlewareを使いやすくチェインするようにした実装例
export type CustomMiddleware = (
  request: NextRequest,
  event: NextFetchEvent,
  response: NextResponse,
) => NextMiddlewareResult | Promise<NextMiddlewareResult>;

type MiddlewareFactory = (middleware: CustomMiddleware) => CustomMiddleware;

export function chain(
  functions: MiddlewareFactory[],
  index = 0,
): CustomMiddleware {
  const current = functions[index];

  if (current) {
    const next = chain(functions, index + 1);
    return current(next);
  }

  return (
    request: NextRequest,
    event: NextFetchEvent,
    response: NextResponse,
  ) => {
    return response;
  };
}
export function middlewareHigherA(middleware: CustomMiddleware) {
  return async (
    request: NextRequest,
    event: NextFetchEvent,
    response: NextResponse = NextResponse.next(),
  ) => {
    console.log("Higher Middleware A called");
    response.cookies.set("auth", "ok");
    return middleware(request, event, response);
  };
}
function middlewareHigherB(middleware: CustomMiddleware) {
  return async (
    request: NextRequest,
    event: NextFetchEvent,
    response: NextResponse = NextResponse.next(),
  ) => {
    console.log("Higher Middleware B called");
    const token = request.headers.get("Authorization");
    if (token !== "Bearer secret") {
      return middleware(request, event, response);
    }

    return Response.json(
      { success: false, message: "authentication failed" },
      { status: 401 },
    );
  };
}
import type { NextMiddlewareResult } from "next/dist/server/web/types";
function middlewareHigherC(middleware: CustomMiddleware) {
  return async (
    request: NextRequest,
    event: NextFetchEvent,
    response: NextResponse = NextResponse.next(),
  ) => {
    console.log("Higher Middleware C called");
    const { pathname } = new URL(request.url);
    // TODO: うーん、auth.tsと二重管理になってしまうのが微妙だな
    if (pathname.startsWith("/protected")) {
      // Clerkの場合
      // const foo = authMiddleware({});
      // return foo(request, event);

      // Kindeの場合
      // return withAuth(request);

      // NextAuthの場合
      // @ts-ignore
      return auth(request, response);
    }
    return middleware(request, event, response);
  };
}
