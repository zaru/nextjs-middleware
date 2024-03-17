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
type MiddlewareFactory = (middleware: NextMiddleware) => NextMiddleware;
function chainMiddlewares(
  functions: MiddlewareFactory[] = [],
  index = 0,
): NextMiddleware {
  const current = functions[index];
  if (current) {
    const next = chainMiddlewares(functions, index + 1);
    return current(next);
  }
  // 最後に積んだレスポンス変更処理を実行する
  // とりあえず実装してみたけど、ミドルウェアのユニットテストが難しくなるな…
  return () =>
    responseStack.reduce((res, stack) => stack(res), NextResponse.next());
}
const responseStack: ((response: NextResponse) => NextResponse)[] = [];
export function middlewareHigherA(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    console.log("Higher Middleware A called");
    const token = request.headers.get("Authorization");
    if (token === "Bearer secret") {
      // 途中でCookieをセットしたりしたいが、これ以外で良い方法が思いつかない
      // この時点で後続ミドルウェアを処理させないならreturn NextResponse.next()で良いが…
      responseStack.push((response: NextResponse) => {
        response.cookies.set("auth", "ok");
        return response;
      });
      request.cookies.set("foo", "bar");
      return middleware(request, event);
    }
    return Response.json(
      { success: false, message: "authentication failed" },
      { status: 401 },
    );
  };
}
function middlewareHigherB(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    console.log("Higher Middleware B called");
    return middleware(request, event);
  };
}
function middlewareHigherC(middleware: NextMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    console.log("Higher Middleware C called");
    return middleware(request, event);
  };
}
export default chainMiddlewares([
  middlewareHigherA,
  middlewareHigherB,
  middlewareHigherC,
]);

export const config = {
  // 静的ファイルの場合はMiddlewareを適用しない
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*.svg).*)"],
};
