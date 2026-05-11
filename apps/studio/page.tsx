
export default function Page() {
  return (
    <main className="min-h-screen bg-[#020617] text-white flex">
      <aside className="w-[260px] border-r border-white/10 p-6 hidden lg:flex flex-col">
        <div className="mb-10">
          <div className="text-xs tracking-[0.3em] text-yellow-400 mb-2">
            MORAL CLARITY AI
          </div>
          <h1 className="text-4xl font-bold">SolaceFrame</h1>
          <p className="text-white/50 mt-2 text-sm">
            Continuity-governed synthetic media.
          </p>
        </div>

        <nav className="space-y-3 text-sm">
          {[
            "Overview",
            "Projects",
            "Characters",
            "Worlds",
            "Timelines",
            "Storyboard",
            "Continuity",
            "Governance",
            "Provenance"
          ].map((item, i) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-yellow-400/40 transition"
            >
              <span className="text-white/40 mr-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item}
            </div>
          ))}
        </nav>
      </aside>

      <section className="flex-1 p-8 lg:p-12 overflow-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-xs tracking-[0.35em] text-yellow-400 mb-4">
              PERSISTENT SYNTHETIC REALITY INFRASTRUCTURE
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-[0.95] max-w-5xl">
              Generate cinematic worlds with persistent continuity and governed identity.
            </h1>
          </div>

          <div className="hidden lg:flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-white/80">
              Continuity synchronized
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-8">
            <div className="text-xs tracking-[0.3em] text-yellow-400 mb-4">
              STORYBOARD ENGINE
            </div>

            <h2 className="text-4xl font-bold mb-4">
              Long-form coherence pipeline
            </h2>

            <p className="text-white/70 max-w-3xl mb-8">
              Preserve character identity, world memory, lineage, scene continuity,
              and cinematic governance across persistent render timelines.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                "Character lock",
                "Scene memory",
                "Timeline sync",
                "Governance gate"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="text-sm text-white/90">{item}</div>
                  <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-yellow-400 to-green-400" />
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-yellow-400/20 bg-black/20 p-5">
              <div className="text-xs tracking-[0.3em] text-yellow-400 mb-4">
                RENDER PIPELINE
              </div>

              <div className="space-y-3 text-sm">
                {[
                  "World state synchronized",
                  "Identity ontology preserved",
                  "Branch arbitration stable",
                  "Continuity drift: low",
                  "Governance admissible",
                  "Render path prepared"
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <span>{item}</span>
                    <span className="text-green-400">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs tracking-[0.3em] text-yellow-400 mb-4">
                CONTINUITY STATE
              </div>

              <h3 className="text-3xl font-bold mb-6">
                Identity lock: stable
              </h3>

              <div className="h-3 rounded-full bg-white/10 overflow-hidden mb-6">
                <div className="h-full w-[88%] bg-gradient-to-r from-yellow-400 to-green-400 rounded-full" />
              </div>

              <div className="space-y-4 text-white/80">
                <div>• Character ontology preserved</div>
                <div>• Environment memory synchronized</div>
                <div>• Style drift monitored</div>
                <div>• Provenance chain sealed</div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs tracking-[0.3em] text-yellow-400 mb-4">
                WORLD GRAPH
              </div>

              <div className="aspect-square rounded-3xl border border-white/10 bg-black/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-400/40" />
                  <div className="absolute top-[25%] left-[35%] h-5 w-5 rounded-full bg-yellow-400" />
                  <div className="absolute top-[60%] left-[70%] h-5 w-5 rounded-full bg-green-400" />
                  <div className="absolute top-[70%] left-[30%] h-5 w-5 rounded-full bg-cyan-400" />
                  <div className="absolute top-[40%] left-[65%] h-5 w-5 rounded-full bg-pink-400" />
                </div>

                <div className="absolute bottom-5 left-5 text-sm text-white/70">
                  Persistent world-state topology
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
