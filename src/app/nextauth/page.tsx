import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    return (
      <div>
        protected page
        <div>login: {session.user.email}</div>
      </div>
    );
  }
  return <div>protected page</div>;
}
