interface AdPlaceholderProps {
  size?: '728x90' | '300x250' | '320x50'
}

export default function AdPlaceholder({ size = '300x250' }: AdPlaceholderProps) {
  const sizeMap = {
    '728x90': 'w-full h-[90px]',
    '300x250': 'w-full h-[250px]',
    '320x50': 'w-full h-[50px]',
  }

  return (
    <div className={`${sizeMap[size]} border border-dashed border-white/10 rounded-lg bg-[#0B1F21] flex items-center justify-center`}>
      <span className="text-xs text-white/20">Ad</span>
    </div>
  )
}
