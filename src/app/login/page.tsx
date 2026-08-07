import { getCurrentUser } from "@/lib/auth/session";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <section className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-md)]">
        <div className="mb-6 grid gap-4">
          <Image
            alt="CapiClub"
            className="h-auto w-full object-contain"
            height={2000}
            priority
            src="/brand/capiclub-wordmark-gold-v2.png"
            width={2000}
          />
          <h1 className="text-2xl font-semibold">Ingresar</h1>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
