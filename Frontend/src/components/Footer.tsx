export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-txt-dim">
        <span>Your PDFs are private. Files auto-deleted after 30 days.</span>
        <span className="font-mono">v1.0.0 · Dark · Focused · Honest</span>
      </div>
    </footer>
  );
}