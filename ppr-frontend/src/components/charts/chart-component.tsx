'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import clsx from 'clsx'

interface PieChartComponentProps {
  labels: string[]
  values: number[]
  colors?: string[] | { [key: string]: string }
  title: string
  isCurrency?: boolean
  className?: string
}

// Default color palette matching the design system
const DEFAULT_COLORS = ['#10B981', '#CCC20B', '#9DA5F6', '#CA0749', '#3882EA']

// Custom tooltip component matching the design system
const CustomTooltip = ({ active, payload, isCurrency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-sm font-medium text-zinc-950 dark:text-white">{data.name}</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {isCurrency
            ? `$${Number(data.value).toLocaleString()}`
            : `${Number(data.value).toLocaleString()}`}
        </p>
      </div>
    )
  }
  return null
}

// Custom label component for better styling
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, isCurrency, value }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // Only show label if segment is large enough
  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {isCurrency
        ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : `${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function PieChartComponent({
  labels,
  values,
  colors,
  title,
  isCurrency = false,
  className,
}: PieChartComponentProps) {
  // Ensure we have valid data
  if (!labels || !values || labels.length === 0 || values.length === 0 || labels.length !== values.length) {
    return (
      <div className={clsx('flex h-[250px] items-center justify-center', className)}>
        <div className="text-sm text-zinc-400 dark:text-zinc-500">No data available</div>
      </div>
    )
  }

  // Check if all values are zero
  if (values.every((val) => val === 0)) {
    return (
      <div className={clsx('flex h-[250px] items-center justify-center', className)}>
        <div className="text-sm text-zinc-400 dark:text-zinc-500">No data available</div>
      </div>
    )
  }

  // Transform labels and values into data format for recharts
  const data = labels.map((label, index) => ({
    name: label,
    value: values[index] || 0,
  }))

  // Get color for each label
  const getColor = (label: string, index: number): string => {
    // If no colors provided, use default palette
    if (!colors) {
      return DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }

    // If colors is an array, use by index
    if (Array.isArray(colors)) {
      return colors[index] || colors[index % colors.length] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }

    // If colors is an object, use by label name
    return colors[label] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }

  return (
    <div className={clsx('flex flex-col', className)}>
      <h3 className="mb-6 text-base/7 font-semibold text-zinc-950 dark:text-white sm:text-sm/6">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props) => (
              <CustomLabel {...props} isCurrency={isCurrency} value={props.value} />
            )}
            outerRadius={90}
            innerRadius={0}
            fill="#8884d8"
            dataKey="value"
            stroke="#09090b" // zinc-950
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip isCurrency={isCurrency} />}
            cursor={{ fill: 'transparent' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '1rem' }}
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

