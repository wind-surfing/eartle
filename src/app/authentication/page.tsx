import AuthenticationForms from "@/components/AuthenticationForms";
import Navbar from "@/components/Navbar";

interface Params {
  mode?: string;
}

export default async function AuthContent({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { mode } = await searchParams;
  const isSignUpMode = mode === "signup";

  return (
    <div className="min-h-[120vh] bg-foreground flex items-center justify-center p-4">
      <Navbar></Navbar>
      <div className="w-full max-w-md">
        <AuthenticationForms initialMode={isSignUpMode ? "signup" : "signin"} />
      </div>
    </div>
  );
}
