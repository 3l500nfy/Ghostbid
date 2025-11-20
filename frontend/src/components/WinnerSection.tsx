const WinnerSection = () => {
  return (
    <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-white backdrop-blur-xl">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Encrypted winner</p>
          <h2 className="text-xl font-semibold text-white">Waiting for finalization</h2>
        </div>
        <span className="rounded-full border border-emerald-400/60 px-3 py-1 text-xs text-emerald-200">FHE locked</span>
      </header>
      <p className="mt-4 text-sm text-emerald-100">
        Once finalized, the winner ciphertext will be pinned here. Only the winner can optionally reveal their amount using a signed proof.
      </p>
    </section>
  );
};

export default WinnerSection;

