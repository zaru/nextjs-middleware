import { getSession } from "@auth0/nextjs-auth0";

export default async function Page() {
  const session = await getSession();
  if (!session) {
    return <div>unauthenticated</div>;
  }

  return (
    <div>
      protected page<div>login {session.user.email}</div>
    </div>
  );
}
