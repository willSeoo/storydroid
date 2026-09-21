export function PrivacyBadge() {
  return (
    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-(--color-line) bg-white px-3 py-1.5 text-xs font-medium text-black/60">
      <span aria-hidden="true">🔒</span> 100% local processing
    </div>
  );
}

export function PrivacyMessage() {
  return (
    <p className="mx-auto max-w-md text-sm leading-relaxed text-black/60">
      Your video stays on your device.
      <br />
      We don't upload it anywhere.
      <br />
      Your embarrassing footage remains your problem.
    </p>
  );
}

export function PrivacySection() {
  return (
    <section className="rounded-2xl border border-(--color-line) bg-white p-6 sm:p-10">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Your video stays yours.</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { icon: '🚫', label: 'No uploads.' },
          { icon: '☁️', label: 'No cloud processing.' },
          { icon: '🏚️', label: 'No mysterious server somewhere in Ohio holding your vacation video.' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-(--color-paper-dim) p-4 text-sm">
            <div className="mb-1 text-lg">{item.icon}</div>
            <p className="text-black/70">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-black/50">
        Everything happens locally in your browser, using WebAssembly. The only thing this app ever downloads is the
        video-processing engine itself — never the other way around.
      </p>
    </section>
  );
}
