'use client';

import * as React from 'react';
import { format, getYear, getMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type MonthPickerValue = Date | null;
export type MonthPickerMultipleValue = Date[];
export type MonthPickerRangeValue = [Date | null, Date | null];

export type MonthPickerType = 'default' | 'multiple' | 'range';

export interface MonthPickerInputProps {
  value?: MonthPickerValue | MonthPickerMultipleValue | MonthPickerRangeValue;
  onChange?: (
    value: MonthPickerValue | MonthPickerMultipleValue | MonthPickerRangeValue
  ) => void;
  type?: MonthPickerType;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  clearable?: boolean;
  valueFormat?: string;
  valueFormatter?: (
    value: Date | Date[] | [Date | null, Date | null]
  ) => string;
  className?: string;
  fromYear?: number;
  toYear?: number;
  dropdownType?: 'popover' | 'modal';
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  'aria-label'?: string;
}

const defaultValueFormat = 'MMMM yyyy';

function formatValue(
  value: MonthPickerValue | MonthPickerMultipleValue | MonthPickerRangeValue,
  type: MonthPickerType,
  valueFormat: string,
  valueFormatter?: (value: Date | Date[] | [Date | null, Date | null]) => string
): string {
  if (valueFormatter) {
    if (type === 'multiple' && Array.isArray(value)) {
      return valueFormatter(value);
    }
    if (type === 'range' && Array.isArray(value)) {
      return valueFormatter(value as [Date | null, Date | null]);
    }
    if (type === 'default' && value instanceof Date) {
      return valueFormatter(value);
    }
  }

  if (type === 'multiple' && Array.isArray(value)) {
    if (value.length === 0) return '';
    if (value.length === 1) {
      return format(value[0], valueFormat, { locale: tr });
    }
    return `${value.length} ay seçildi`;
  }

  if (type === 'range' && Array.isArray(value)) {
    const [start, end] = value as [Date | null, Date | null];
    if (!start && !end) return '';
    if (start && !end) {
      return `${format(start, valueFormat, { locale: tr })} - ...`;
    }
    if (start && end) {
      return `${format(start, valueFormat, { locale: tr })} - ${format(
        end,
        valueFormat,
        { locale: tr }
      )}`;
    }
    return '';
  }

  if (type === 'default' && (value instanceof Date || value === null)) {
    if (!value) return '';
    return format(value, valueFormat, { locale: tr });
  }

  return '';
}

export function MonthPickerInput({
  value,
  onChange,
  type = 'default',
  placeholder = 'Ay seçin',
  label,
  disabled = false,
  clearable = false,
  valueFormat = defaultValueFormat,
  valueFormatter,
  className,
  fromYear = 2026,
  toYear = 2030,
  dropdownType = 'popover',
  leftSection,
  rightSection,
  'aria-label': ariaLabel,
}: MonthPickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [currentYear, setCurrentYear] = React.useState(() => {
    if (type === 'default' && value instanceof Date) {
      return getYear(value);
    }
    if (
      type === 'multiple' &&
      Array.isArray(value) &&
      value.length > 0 &&
      value[0] instanceof Date
    ) {
      return getYear(value[0]);
    }
    if (type === 'range' && Array.isArray(value) && value[0] instanceof Date) {
      return getYear(value[0]);
    }
    return getYear(new Date());
  });

  const displayValue = formatValue(
    value ??
      (type === 'default' ? null : type === 'multiple' ? [] : [null, null]),
    type,
    valueFormat,
    valueFormatter
  );

  const handleMonthClick = (month: number, year: number) => {
    const selectedDate = new Date(year, month, 1);

    if (type === 'default') {
      onChange?.(selectedDate);
      setOpen(false);
    } else if (type === 'multiple') {
      const currentValue = (value as MonthPickerMultipleValue) || [];
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const existingIndex = currentValue.findIndex((d) => {
        const dKey = `${getYear(d)}-${String(getMonth(d) + 1).padStart(
          2,
          '0'
        )}`;
        return dKey === monthKey;
      });

      let newValue: Date[];
      if (existingIndex >= 0) {
        newValue = currentValue.filter((_, i) => i !== existingIndex);
      } else {
        newValue = [...currentValue, selectedDate].sort((a, b) => {
          const aKey = `${getYear(a)}-${String(getMonth(a) + 1).padStart(
            2,
            '0'
          )}`;
          const bKey = `${getYear(b)}-${String(getMonth(b) + 1).padStart(
            2,
            '0'
          )}`;
          return aKey.localeCompare(bKey);
        });
      }
      onChange?.(newValue);
    } else if (type === 'range') {
      const currentValue = (value as MonthPickerRangeValue) || [null, null];
      const [start, end] = currentValue;

      if (!start || (start && end)) {
        // Yeni aralık başlat
        onChange?.([selectedDate, null]);
      } else if (start && !end) {
        // Aralığı tamamla
        const startKey = `${getYear(start)}-${String(
          getMonth(start) + 1
        ).padStart(2, '0')}`;
        const selectedKey = `${year}-${String(month + 1).padStart(2, '0')}`;

        if (selectedKey < startKey) {
          // Seçilen ay başlangıçtan önce, yeni aralık başlat
          onChange?.([selectedDate, null]);
        } else {
          // Aralığı tamamla
          onChange?.([start, selectedDate]);
          setOpen(false);
        }
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'default') {
      onChange?.(null);
    } else if (type === 'multiple') {
      onChange?.([]);
    } else if (type === 'range') {
      onChange?.([null, null]);
    }
  };

  const isMonthSelected = (month: number, year: number): boolean => {
    if (type === 'default' && value instanceof Date) {
      return getYear(value) === year && getMonth(value) === month;
    }
    if (type === 'multiple' && Array.isArray(value)) {
      return value.some(
        (d) => d instanceof Date && getYear(d) === year && getMonth(d) === month
      );
    }
    if (type === 'range' && Array.isArray(value)) {
      const [start, end] = value as [Date | null, Date | null];
      if (!start || !(start instanceof Date)) return false;
      const startKey = `${getYear(start)}-${String(
        getMonth(start) + 1
      ).padStart(2, '0')}`;
      const selectedKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      if (end && end instanceof Date) {
        const endKey = `${getYear(end)}-${String(getMonth(end) + 1).padStart(
          2,
          '0'
        )}`;
        return selectedKey >= startKey && selectedKey <= endKey;
      }
      return selectedKey === startKey;
    }
    return false;
  };

  const isMonthInRange = (month: number, year: number): boolean => {
    if (type === 'range' && Array.isArray(value)) {
      const [start, end] = value as [Date | null, Date | null];
      if (!start || !end) return false;
      const startKey = `${getYear(start)}-${String(
        getMonth(start) + 1
      ).padStart(2, '0')}`;
      const endKey = `${getYear(end)}-${String(getMonth(end) + 1).padStart(
        2,
        '0'
      )}`;
      const selectedKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      return selectedKey > startKey && selectedKey < endKey;
    }
    return false;
  };

  const months = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => fromYear + i
  );

  const handleYearChange = (newYear: number) => {
    setCurrentYear(newYear);
  };

  const handlePrevYear = () => {
    if (currentYear > fromYear) {
      setCurrentYear(currentYear - 1);
    }
  };

  const handleNextYear = () => {
    if (currentYear < toYear) {
      setCurrentYear(currentYear + 1);
    }
  };

  const showClearButton = clearable && displayValue && !rightSection;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !displayValue && 'text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            disabled={disabled}
            aria-label={ariaLabel || label || 'Ay seçin'}
          >
            {leftSection && (
              <span className="mr-2 shrink-0">{leftSection}</span>
            )}
            {!leftSection && <CalendarIcon className="mr-2 h-4 w-4" />}
            <span className="flex-1">{displayValue || placeholder}</span>
            {showClearButton && (
              <X
                className="ml-2 h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            {rightSection && !showClearButton && (
              <span className="ml-2 shrink-0">{rightSection}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-4">
            {/* Year Navigation */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handlePrevYear}
                disabled={currentYear <= fromYear}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select
                value={String(currentYear)}
                onValueChange={(value) => handleYearChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleNextYear}
                disabled={currentYear >= toYear}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Months Grid */}
            <div className="grid grid-cols-3 gap-2">
              {months.map((monthName, monthIndex) => {
                const isSelected = isMonthSelected(monthIndex, currentYear);
                const isInRange = isMonthInRange(monthIndex, currentYear);
                const isRangeStart =
                  type === 'range' &&
                  Array.isArray(value) &&
                  value[0] &&
                  getYear(value[0]) === currentYear &&
                  getMonth(value[0]) === monthIndex;
                const isRangeEnd =
                  type === 'range' &&
                  Array.isArray(value) &&
                  value[1] &&
                  getYear(value[1]) === currentYear &&
                  getMonth(value[1]) === monthIndex;

                return (
                  <Button
                    key={monthIndex}
                    variant={isSelected ? 'default' : 'ghost'}
                    className={cn(
                      'h-10 w-full rounded-xl',
                      isSelected && 'bg-primary text-primary-foreground',
                      isInRange && 'bg-accent text-accent-foreground',
                      isRangeStart && 'rounded-l-md',
                      isRangeEnd && 'rounded-r-md',
                      isInRange &&
                        !isRangeStart &&
                        !isRangeEnd &&
                        'rounded-none'
                    )}
                    onClick={() => handleMonthClick(monthIndex, currentYear)}
                  >
                    {monthName}
                  </Button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
