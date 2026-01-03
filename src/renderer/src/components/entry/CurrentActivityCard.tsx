import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTimeEntriesStore } from '@/store/timeEntriesStore'
import { formatDuration } from '@/lib/utils'
import { differenceInSeconds } from 'date-fns'

export function CurrentActivityCard() {
  const { currentActive, getCurrentActive } = useTimeEntriesStore()
  const [duration, setDuration] = useState(0)

  // Initial fetch
  useEffect(() => {
    getCurrentActive()
  }, [])

  // Timer logic
  useEffect(() => {
    if (!currentActive) {
      setDuration(0)
      return
    }

    const calculateDuration = () => {
      const start = new Date(currentActive.start_time)
      const now = new Date()
      return differenceInSeconds(now, start)
    }

    setDuration(calculateDuration())

    const intervalId = setInterval(() => {
      setDuration(calculateDuration())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [currentActive])

  if (!currentActive) {
    return (
      <Card className="bg-slate-50 border-slate-200 border-dashed">
        <CardContent className="p-6 flex items-center justify-center h-32">
          <p className="text-slate-400">当前无正在进行的事项，请开始一项新工作</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm transition-all duration-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">正在进行</p>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {currentActive.title}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500 mb-1">已持续</p>
            <p className="text-3xl font-mono font-bold text-blue-600 tabular-nums">
              {formatDuration(duration)}
            </p>
          </div>
        </div>
        
        {currentActive.description && (
             <p className="text-sm text-slate-600 mt-2 mb-3 line-clamp-1">{currentActive.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {currentActive.dimensions.map((dim) => (
            <Badge
              key={dim.option_id}
              variant="outline"
              className="px-2 py-0.5 text-xs font-medium border-0"
              style={{ 
                backgroundColor: dim.option_color + '20', // 12% opacity
                color: dim.option_color,
                boxShadow: `0 0 0 1px ${dim.option_color}40` // 25% opacity border
              }}
            >
              <span className="opacity-70 mr-1">{dim.dimension_name}:</span>
              {dim.option_name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

