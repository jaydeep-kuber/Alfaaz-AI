import { redirect } from "next/navigation";
import { auth } from "@/src/lib/auth/auth";
import { headers } from "next/headers";
import { APP_NAME, APP_NAME_HINDI } from "@/src/lib/constants";

/**
 * Home page / Dashboard
 * Checks session server-side. Authenticated users land here after sign-up / sign-in.
 * Unauthenticated visitors are redirected to /signin.
 */
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/signin");
  }

  const user = session.user;
  const firstLetter = user.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1f1b17] flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-[#E2D7C8] bg-[#FAF6EF]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <span className="font-serif text-xl font-medium tracking-tight text-[#293343]">
              {APP_NAME_HINDI}
            </span>
            <span className="text-xs uppercase tracking-widest text-[#8A7F73] font-medium pl-2 border-l border-[#E2D7C8]">
              {APP_NAME.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[#675d52] hidden sm:block">{user.name}</span>
            <div className="w-9 h-9 rounded-full bg-[#293343] text-white flex items-center justify-center font-serif text-sm font-medium select-none">
              {firstLetter}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 sm:px-10 py-12 sm:py-16">
        {/* Welcome Banner */}
        <section className="mb-12">
          <div className="w-10 h-0.5 bg-[#293343]/20 mb-6" />
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#293343] tracking-tight mb-3">
            Welcome back, {user.name?.split(" ")[0]}.
          </h1>
          <p className="text-[#675d52] text-base leading-relaxed max-w-xl">
            Your sanctuary for poetry, prose, and unfinished thoughts. Begin where you left off.
          </p>
        </section>

        {/* Quick-Action Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {[
            {
              label: "New Poem",
              hint: "Start with a blank folio",
              icon: "✦",
            },
            {
              label: "My Drafts",
              hint: "Revisit unfinished pieces",
              icon: "◈",
            },
            {
              label: "Archive",
              hint: "Browse all your writings",
              icon: "◎",
            },
          ].map((card) => (
            <button
              key={card.label}
              className="group text-left p-6 rounded-2xl bg-white border border-[#E2D7C8] hover:border-[#293343]/30 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <span className="text-2xl mb-4 block text-[#293343]/40 group-hover:text-[#293343] transition-colors">
                {card.icon}
              </span>
              <h2 className="font-serif text-lg font-medium text-[#293343] mb-1">
                {card.label}
              </h2>
              <p className="text-sm text-[#8A7F73]">{card.hint}</p>
            </button>
          ))}
        </section>

        {/* Recent Activity Placeholder */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl font-normal text-[#293343]">Recent Writings</h2>
            <span className="text-xs uppercase tracking-widest text-[#8A7F73]">View all</span>
          </div>

          <div className="rounded-2xl border border-dashed border-[#E2D7C8] bg-white/50 p-12 text-center">
            <span className="text-4xl block mb-4 opacity-30">✦</span>
            <p className="text-[#8A7F73] text-sm leading-relaxed">
              Your folio is empty. Begin your first piece above.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2D7C8]/60 py-6">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 flex items-center justify-between text-xs text-[#8A7F73]">
          <span className="uppercase tracking-widest font-medium">
            {APP_NAME} Editorial Press
          </span>
          <span>End-to-End Encrypted &nbsp;·&nbsp; Zero Telemetry</span>
        </div>
      </footer>
    </div>
  );
}
