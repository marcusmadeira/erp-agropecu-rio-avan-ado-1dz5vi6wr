import * as React from 'react'
import { Tooltip, TooltipProps } from 'recharts'

export function ChartContainer({
  config,
  children,
  className,
}: {
  config: Record<string, { label?: string; color?: string }>
  children: React.ReactElement
  className?: string
}) {
  const style = Object.entries(config).reduce((acc, [key, value]) => {
    if (value.color) {
      acc[`--color-${key}` as any] = value.color
    }
    return acc
  }, {} as React.CSSProperties)

  return (
    <div style={style} className={className}>
      {children}
    </div>
  )
}

export function ChartTooltip({ content, ...props }: any) {
  return <Tooltip content={content} cursor={{ fill: 'rgba(0,0,0,0.05)' }} {...props} />
}

export function ChartTooltipContent({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md z-50">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center text-sm">
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: item.color || item.payload?.fill }}
            />
            <span className="text-gray-600 mr-2">{item.name || item.dataKey}:</span>
            <span className="font-medium text-gray-900">
              {typeof item.value === 'number' && item.dataKey === 'revenue'
                ? `R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : item.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}
