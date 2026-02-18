const STYLES = {
  primary:
    'inline-flex items-center justify-center rounded-sm border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-70',
  ghost:
    'inline-flex items-center justify-center rounded-sm border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70',
  danger:
    'inline-flex items-center justify-center rounded-sm border border-red-400 bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70',
}

export default function Button({ variant = 'primary', className = '', ...props }) {
  const style = STYLES[variant] || STYLES.primary
  return <button className={`${style} ${className}`.trim()} {...props} />
}
