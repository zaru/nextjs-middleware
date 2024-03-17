import { type NextMiddleware, NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

// 素朴なMiddlewareの実装例
async function heavyTask() {
  const response = await fetch("http://localhost:9999/heavy.php", {
    method: "GET",
  });
  const content = await response.text();
  console.log("done heavyTask: ", content);
}
async function middlewareA(request: NextRequest) {
  console.log("Middleware A called");
}
async function middlewareB(request: NextRequest) {
  console.log("Middleware B called");
}
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = new URL(request.url);
  console.log("Middleware called", request.method, pathname);
  await middlewareA(request);
  await middlewareB(request);
  event.waitUntil(heavyTask());

  return NextResponse.next();
}

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
// type MiddlewareFactory = (middleware: NextMiddleware) => NextMiddleware;
// function chainMiddlewares(
//   functions: MiddlewareFactory[] = [],
//   index = 0,
// ): NextMiddleware {
//   const current = functions[index];
//   if (current) {
//     const next = chainMiddlewares(functions, index + 1);
//     return current(next);
//   }
//   return () => NextResponse.next();
// }
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
// function middlewareHigherC(middleware: NextMiddleware) {
//   return async (request: NextRequest, event: NextFetchEvent) => {
//     console.log("Higher Middleware C called");
//     return middleware(request, event);
//   };
// }
// export default chainMiddlewares([
//   middlewareHigherA,
//   middlewareHigherB,
//   middlewareHigherC,
// ]);

export const config = {
  // 静的ファイルの場合はMiddlewareを適用しない
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*.svg).*)"],
};
