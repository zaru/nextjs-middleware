import { SignOutButton } from "@/app/nextauth/components/SignOutButton";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    return (
      <div>
        protected page
        <div>login: {session.user.email}</div>
        <SignOutButton />
      </div>
    );
  }
  return <div>protected page</div>;
}
