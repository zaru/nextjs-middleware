import { SignOutButton } from "@/app/clerk/components/SignOutButton";
import { currentUser } from "@clerk/nextjs";

export default async function Page() {
  const user = await currentUser();
  if (!user) {
    return <div>not authenticated</div>;
  }

  return (
    <div>
      protected page
      <div>
        login {user.emailAddresses.map((v) => v.emailAddress).join(" ")}
      </div>
      <SignOutButton />
    </div>
  );
}
