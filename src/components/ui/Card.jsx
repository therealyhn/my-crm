export default function Card({ title, children, actions }) {
  return (
    <section className="animate-fade-up rounded-sm border border-border bg-surface p-4 shadow-frame">
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="font-display text-h3 text-text">{title}</h2> : <span />}
          {actions || null}
        </header>
      )}
      {(title || actions) && <div className="mb-3 h-px w-full bg-slate-300/80" />}
      {children}
    </section>
  )
}
