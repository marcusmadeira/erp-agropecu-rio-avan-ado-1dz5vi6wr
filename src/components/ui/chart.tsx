import * as React from 'react'
import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export function ChartContainer({ children, config, className }: any) {
  const style = Object.entries(config || {}).reduce((acc, [k, v]: any) => {
    return { ...acc, [`--color-${k}`]: v.color }
  }, {})
  return (
    <div
      className={cn('w-full h-full min-h-[200px]', className)}
      style={style as React.CSSProperties}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}
export function ChartTooltip({ content, ...props }: any) {
  return null
}
export function ChartTooltipContent({ ...props }: any) {
  return null
}
export function ChartLegend({ content, ...props }: any) {
  return null
}
export function ChartLegendContent({ ...props }: any) {
  return null
}
