export type ToothVariant = 'healthy' | 'cavity' | 'filling' | 'rootcanal' | 'extraction'

/** Small, friendly flat-style tooth icon used to help patients visualize a procedure. */
export function ToothDiagram({ variant, className }: { variant: ToothVariant; className?: string }) {
  const faded = variant === 'extraction'
  const crownFill = '#ffffff'
  const rootFill = variant === 'rootcanal' ? '#fecaca' : '#ffffff'
  const stroke = '#94a3b8'

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g opacity={faded ? 0.35 : 1}>
        <path d="M20 30 Q18 48 22 58 Q26 50 26 32 Z" fill={rootFill} stroke={stroke} strokeWidth="2" />
        <path d="M44 30 Q46 48 42 58 Q38 50 38 32 Z" fill={rootFill} stroke={stroke} strokeWidth="2" />
        <rect x="14" y="8" width="36" height="26" rx="12" fill={crownFill} stroke={stroke} strokeWidth="2" />
        {variant === 'rootcanal' && <rect x="30" y="18" width="4" height="36" rx="2" fill="#f43f5e" opacity="0.7" />}
        {variant === 'cavity' && <circle cx="30" cy="20" r="5" fill="#78350f" />}
        {variant === 'filling' && <rect x="25" y="15" width="12" height="10" rx="3" fill="#94a3b8" />}
      </g>
      {variant === 'extraction' && (
        <g stroke="#f43f5e" strokeWidth="4" strokeLinecap="round">
          <line x1="16" y1="16" x2="48" y2="48" />
          <line x1="48" y1="16" x2="16" y2="48" />
        </g>
      )}
    </svg>
  )
}

/** Best-effort visual for a phrase: a tooth diagram for dental-procedure phrases, else a plain emoji badge. */
export function iconForPhrase(en: string, fallbackEmoji: string): { kind: 'tooth'; variant: ToothVariant } | { kind: 'emoji'; value: string } {
  const t = en.toLowerCase()
  if (t.includes('root canal') || t.includes('nerve')) return { kind: 'tooth', variant: 'rootcanal' }
  if (t.includes('cavity')) return { kind: 'tooth', variant: 'cavity' }
  if (t.includes('filling')) return { kind: 'tooth', variant: 'filling' }
  if (t.includes('pull') || t.includes('extract') || t.includes('remove') || t.includes('come out')) {
    return { kind: 'tooth', variant: 'extraction' }
  }
  if (t.includes('clean') || t.includes('healthy')) return { kind: 'tooth', variant: 'healthy' }
  if (t.includes('x-ray')) return { kind: 'emoji', value: '🩻' }
  if (t.includes('numb') || t.includes('inject') || t.includes('anesthe') || t.includes('pinch')) return { kind: 'emoji', value: '💉' }
  if (t.includes('pain') || t.includes('hurt') || t.includes('ache')) return { kind: 'emoji', value: '🤕' }
  if (t.includes('medic') || t.includes('pill') || t.includes('antibiotic')) return { kind: 'emoji', value: '💊' }
  if (t.includes('insurance') || t.includes('pay') || t.includes('card') || t.includes('cash') || t.includes('dollar')) {
    return { kind: 'emoji', value: '💳' }
  }
  if (t.includes('appointment') || t.includes('schedule') || t.includes('visit') || t.includes('free')) {
    return { kind: 'emoji', value: '📅' }
  }
  if (t.includes('emergency') || t.includes('broken') || t.includes('chip')) return { kind: 'emoji', value: '🚨' }
  return { kind: 'emoji', value: fallbackEmoji }
}
