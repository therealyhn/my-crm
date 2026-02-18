export default function PageState({ children }) {
  return (
    <div className="rounded-sm border border-border bg-surface p-4 text-body text-muted shadow-frame">
      {children}
    </div>
  )
}
