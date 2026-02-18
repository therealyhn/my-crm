export default function Card({ title, children, actions }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : <span />}
          {actions || null}
        </header>
      )}
      {children}
    </section>
  )
}
