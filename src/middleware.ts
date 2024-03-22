// export { basicMiddleware as middleware } from "@/middlewares/basicMiddleware";
export { middleware } from "@/middlewares/hofMiddleware";
// export { auth as middleware } from "./lib/auth";

// import { authMiddleware } from "@clerk/nextjs";
// export default authMiddleware();

export const config = {
  // 静的ファイルの場合はMiddlewareを適用しない
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*.svg).*)"],
};
