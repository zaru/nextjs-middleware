import { auth } from "@/lib/auth";
import type { NextApiRequest } from "next";
import type { NextMiddlewareResult } from "next/dist/server/web/types";
import { type NextMiddleware, NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

// 素朴なMiddlewareの実装例
// ただ、これだと途中のミドルウェアでレスポンスを返すなどがやりにくい（認証エラーなど）
// async function heavyTask() {
//   const response = await fetch("http://localhost:9999/heavy.php", {
//     method: "GET",
//   });
//   const content = await response.text();
//   console.log("done heavyTask: ", content);
// }
// async function middlewareA(request: NextRequest) {
//   console.log("Middleware A called");
// }
// async function middlewareB(request: NextRequest) {
//   console.log("Middleware B called");
// }
// export async function middleware(request: NextRequest, event: NextFetchEvent) {
//   const { pathname } = new URL(request.url);
//   console.log("Middleware called", request.method, pathname);
//   await middlewareA(request);
//   await middlewareB(request);
//   event.waitUntil(heavyTask());
//
//   const response = NextResponse.next();
//   response.cookies.set("auth", "ok");
//   return response;
// }

// Higher Order Middlewareの実装例
// function middlewareHigherA(middleware: NextMiddleware) {
//   return async (request: NextRequest, event: NextFetchEvent) => {
//     console.log("Higher Middleware A called");
//     return middleware(request, event);
//   };
// }
// function middlewareHigherB(middleware: NextMiddleware) {
//   return async (request: NextRequest, event: NextFetchEvent) => {
//     console.log("Higher Middleware B called");
//     return middleware(request, event);
//   };
// }
// function middlewareHigherC(request: NextRequest) {
//   console.log("Higher Middleware C called");
//   return NextResponse.next();
// }
// export default middlewareHigherA(middlewareHigherB(middlewareHigherC));

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
    if (token === "Bearer secret") {
      return middleware(request, event, response);
    }

    return Response.json(
      { success: false, message: "authentication failed" },
      { status: 401 },
    );
  };
}
function middlewareHigherC(middleware: CustomMiddleware) {
  return async (
    request: NextRequest,
    event: NextFetchEvent,
    response: NextResponse = NextResponse.next(),
  ) => {
    console.log("Higher Middleware C called");
    return middleware(request, event, response);
  };
}
export default chain([middlewareHigherA, middlewareHigherB, middlewareHigherC]);

// NextAuth公式ドキュメントのMiddlewareで認証させるパターン
// export { auth as middleware } from "./lib/auth";

export const config = {
  // 静的ファイルの場合はMiddlewareを適用しない
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*.svg).*)"],
};
