import { loadEnvConfig } from "@next/env";
// BunだとNode.js cryptoのhkdfにはまだ対応していないので、依存がないfutoin-hkdfを使う
import hkdf from "futoin-hkdf";
import * as jose from "jose";

const BYTE_LENGTH = 32;
const ENCRYPTION_INFO = "JWE CEK";
const digest = "sha256";

// Auth0にログイン済みのCookieを作成する
// 例:
// await encryptedCookie(
//   "nickname",
//   "user@example.com.com",
//   "auth0|1|sample-",
// )
// app: (management) と (sso-link) 制御判定用、通常は management
export async function encryptedCookie(
  nickname: string,
  name: string,
  sub: string,
  app = "management",
) {
  loadEnvConfig("./");
  const today = Math.floor(new Date().getTime() / 1000);
  const exp = today + 86400;
  const header = {
    alg: "dir",
    enc: "A256GCM",
    uat: today,
    iat: today,
    exp,
  };
  const jwt = {
    user: {
      nickname,
      name,
      picture: "https://s.gravatar.com/avatar/",
      updated_at: "2024-03-25T01:04:52.382Z",
      sub,
      sid: "dummy",
      app,
    },
    accessToken: "dummy",
    accessTokenScope: "openid profile",
    accessTokenExpiresAt: exp,
    idToken: "dummy",
    token_type: "Bearer",
  };
  return await encryptAuth0(jwt, header, process.env.AUTH0_SECRET || "");
}

function encryption(secret: string) {
  return hkdf(secret, BYTE_LENGTH, {
    salt: "",
    info: ENCRYPTION_INFO,
    hash: digest,
  });
}

async function encryptAuth0(
  jwt: jose.JWTPayload,
  header: jose.CompactJWEHeaderParameters,
  secret: string,
) {
  const key = encryption(secret);
  return new jose.EncryptJWT({ ...jwt })
    .setProtectedHeader({ ...header })
    .encrypt(key);
}

// debug用
async function decryptAuth0(encryptedText: string, secret: string) {
  const key = encryption(secret);
  const { payload, protectedHeader } = await jose.jwtDecrypt(
    encryptedText,
    key,
  );
  return { payload, protectedHeader };
}
