import { redirect } from "next/navigation";

/**
 * Root route redirects to /signup.
 * Placeholder card UI removed per AUTH-2 requirements.
 */
export default function Home() {
  redirect("/signup");
}
