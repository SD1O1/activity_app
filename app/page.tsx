// app/page.tsx
import HomePage from "@/components/home/HomePage";
import { requireCompletedProfile } from "@/lib/guard/onboardingGuard";

export default async function Page() {
  const { user } = await requireCompletedProfile();
  return <HomePage/>;
}