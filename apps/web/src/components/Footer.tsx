export default function Footer() {
  return (
    <footer className="mt-24 border-t border-solana-border/40">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="gradient-text font-bold text-lg">x402 Explorer</span>
            <span className="text-solana-muted text-sm">— Colosseum Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-solana-muted">
            <a
              href="https://x402.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-solana-green transition-colors duration-200"
            >
              x402 Protocol
            </a>
            <a
              href="https://helius.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-solana-green transition-colors duration-200"
            >
              Helius
            </a>
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-solana-green transition-colors duration-200"
            >
              Solana
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
