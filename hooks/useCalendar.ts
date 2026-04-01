import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'

export function useCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  return {
    currentMonth,
    selectedDate,
    calendarDays,
    setSelectedDate,
    nextMonth,
    prevMonth,
    goToToday,
    formatTitle: () => format(currentMonth, 'yyyy년 M월', { locale: ko }),
    isToday: (date: Date) => isSameDay(date, new Date()),
    isSameMonth: (date: Date) => isSameMonth(date, currentMonth),
    isSelected: (date: Date) => isSameDay(date, selectedDate)
  }
}
