import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

// @ts-ignore
import { cn } from '@/lib/utils'
// @ts-ignore
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  style,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('ui__calendar p-3', className)}
      style={{ maxWidth: '100%', ...style }}
      classNames={{
        months: 'relative flex flex-col sm:flex-row space-y-4 sm:space-y-0',
        month: 'rdp-month w-full space-y-4',
        month_caption: 'flex justify-start pt-1 pr-24 relative items-center',
        caption_label: 'text-sm font-medium',
        dropdowns: 'flex items-center justify-start gap-3',
        months_dropdown: 'rdp-dropdown_month',
        years_dropdown: 'rdp-dropdown_year',
        dropdown_root: 'relative',
        dropdown: 'absolute inset-0 z-[2] opacity-0 cursor-pointer',
        nav: 'absolute right-0 top-1 z-10 flex items-center gap-2',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'hidden',
        weekday:
          'text-muted-foreground rounded-md w-9 text-center font-normal text-[0.8rem]',
        week: 'flex w-full mt-2 justify-between',
        day: 'h-9 w-9 flex items-center justify-center text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md ' +
          '[&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-transparent ' +
          'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md ' +
          'focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        range_end: 'day-range-end',
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground [&>button:focus]:bg-primary [&>button:focus]:text-primary-foreground',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
        outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('h-4 w-4', props.className)} />
          ) : (
            <ChevronRight className={cn('h-4 w-4', props.className)} />
          ),
        ...components,
      }}
      {...props}
    />
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }
