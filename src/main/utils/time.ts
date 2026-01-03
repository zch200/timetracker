/**
 * 计算两个时间之间的时长（分钟）
 * @param startTime HH:MM 格式，如 "09:30"
 * @param endTime HH:MM 格式，如 "11:00"
 * @returns 时长（分钟）
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return endMinutes - startMinutes
}

