export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-text transition-colors focus:border-accentSoft focus:outline-none focus:ring-2 focus:ring-slate-300 ${className}`.trim()}
      {...props}
    />
  )
}
