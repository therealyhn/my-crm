export default function Card({ title, children, actions }) {
  return (
    <section className="panel-surface p-4 animate-fade-up">
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="font-display text-h3 text-text">{title}</h2> : <span />}
          {actions || null}
        </header>
      )}
      {(title || actions) && <div className="hairline mb-3" />}
      {children}
    </section>
  )
}
