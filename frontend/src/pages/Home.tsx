import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-4">
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-400">GhostBid</p>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
          FHE-encrypted NFT auctions with sealed bids forever.
        </h1>
        <p className="text-lg text-slate-300">
          Encrypt bids locally with Zama fhEVM tooling, keep them confidential on-chain, and let homomorphic
          comparators select winners without revealing amounts.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-emerald-500/90 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
            to="/create"
          >
            Create Auction
          </Link>
          <Link
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:border-white/50"
            to="/auction/1"
          >
            Explore Demo Auction
          </Link>
        </div>
      </header>
      <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:grid-cols-2">
        <article>
          <h2 className="text-lg font-semibold text-white">Sealed bids stay encrypted</h2>
          <p className="text-sm text-slate-300">
            Every bid is encrypted client-side via Zama SDK. Only ciphertext hits the blockchain, preventing sniping,
            MEV, and leaking alpha.
          </p>
        </article>
        <article>
          <h2 className="text-lg font-semibold text-white">Homomorphic resolution</h2>
          <p className="text-sm text-slate-300">
            Auctions finalize via an fhEVM comparator that computes the highest ciphertext and stores the encrypted
            result for optional reveal.
          </p>
        </article>
      </section>
    </main>
  );
};

export default Home;

