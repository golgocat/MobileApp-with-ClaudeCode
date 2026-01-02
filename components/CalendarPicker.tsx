import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";

interface CalendarPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDates: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

type DateShortcut = {
  label: string;
  getStartDate: () => Date;
  duration: number;
};

const SHORTCUTS: DateShortcut[] = [
  { label: "Tomorrow", getStartDate: () => addDays(new Date(), 1), duration: 1 },
  { label: "This Weekend", getStartDate: () => getNextWeekend(), duration: 2 },
  { label: "In 3 Days", getStartDate: () => addDays(new Date(), 3), duration: 3 },
  { label: "Next Week", getStartDate: () => addDays(new Date(), 7), duration: 5 },
];

const DURATIONS = [
  { label: "1 Day", days: 1 },
  { label: "2 Days", days: 2 },
  { label: "3 Days", days: 3 },
  { label: "5 Days", days: 5 },
  { label: "1 Week", days: 7 },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextWeekend(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  return addDays(today, daysUntilSaturday);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];

  // Add empty slots for days before the first day of month
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

export function CalendarPicker({
  visible,
  onClose,
  onSelectDates,
  initialStartDate,
  initialEndDate,
}: CalendarPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [startDate, setStartDate] = useState<Date | null>(
    initialStartDate ? parseDate(initialStartDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialEndDate ? parseDate(initialEndDate) : null
  );
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Max date is 5 days from today (forecast limit)
  const maxDate = addDays(today, 5);

  const monthDays = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const handleDayPress = (date: Date) => {
    if (date < today || date > maxDate) return;

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setSelectedDuration(null);
    } else {
      // Complete selection
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setSelectedDuration(null);
    }
  };

  const handleShortcut = (shortcut: DateShortcut) => {
    const start = shortcut.getStartDate();
    start.setHours(0, 0, 0, 0);

    if (start > maxDate) return;

    let end = addDays(start, shortcut.duration - 1);
    if (end > maxDate) {
      end = maxDate;
    }

    setStartDate(start);
    setEndDate(end);
    setSelectedDuration(null);
    setCurrentMonth(start.getMonth());
    setCurrentYear(start.getFullYear());
  };

  const handleDuration = (days: number) => {
    if (!startDate) {
      // If no start date, use tomorrow
      const start = addDays(today, 1);
      let end = addDays(start, days - 1);
      if (end > maxDate) end = maxDate;
      setStartDate(start);
      setEndDate(end);
    } else {
      let end = addDays(startDate, days - 1);
      if (end > maxDate) end = maxDate;
      setEndDate(end);
    }
    setSelectedDuration(days);
  };

  const handleConfirm = () => {
    if (startDate && endDate) {
      onSelectDates(formatDate(startDate), formatDate(endDate));
      onClose();
    } else if (startDate) {
      // Single day trip
      onSelectDates(formatDate(startDate), formatDate(startDate));
      onClose();
    }
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const canGoPrev = currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());

  const canGoNext = currentYear < maxDate.getFullYear() ||
    (currentYear === maxDate.getFullYear() && currentMonth < maxDate.getMonth());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Select Trip Dates</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {/* Quick Shortcuts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Select</Text>
              <View style={styles.shortcutsRow}>
                {SHORTCUTS.map((shortcut) => {
                  const shortcutStart = shortcut.getStartDate();
                  const isDisabled = shortcutStart > maxDate;
                  return (
                    <Pressable
                      key={shortcut.label}
                      style={[
                        styles.shortcutButton,
                        isDisabled && styles.shortcutButtonDisabled,
                      ]}
                      onPress={() => !isDisabled && handleShortcut(shortcut)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.shortcutText,
                          isDisabled && styles.shortcutTextDisabled,
                        ]}
                      >
                        {shortcut.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Duration Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Duration</Text>
              <View style={styles.durationsRow}>
                {DURATIONS.map((duration) => (
                  <Pressable
                    key={duration.label}
                    style={[
                      styles.durationButton,
                      selectedDuration === duration.days && styles.durationButtonSelected,
                    ]}
                    onPress={() => handleDuration(duration.days)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        selectedDuration === duration.days && styles.durationTextSelected,
                      ]}
                    >
                      {duration.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.section}>
              <View style={styles.calendarHeader}>
                <Pressable
                  onPress={goToPrevMonth}
                  style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
                  disabled={!canGoPrev}
                >
                  <Text style={[styles.navButtonText, !canGoPrev && styles.navButtonTextDisabled]}>
                    ‹
                  </Text>
                </Pressable>
                <Text style={styles.monthTitle}>
                  {MONTHS[currentMonth]} {currentYear}
                </Text>
                <Pressable
                  onPress={goToNextMonth}
                  style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
                  disabled={!canGoNext}
                >
                  <Text style={[styles.navButtonText, !canGoNext && styles.navButtonTextDisabled]}>
                    ›
                  </Text>
                </Pressable>
              </View>

              {/* Weekday Headers */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day) => (
                  <View key={day} style={styles.weekdayCell}>
                    <Text style={styles.weekdayText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {monthDays.map((date, index) => {
                  if (!date) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  const isPast = date < today;
                  const isFuture = date > maxDate;
                  const isDisabled = isPast || isFuture;
                  const isStart = startDate && isSameDay(date, startDate);
                  const isEnd = endDate && isSameDay(date, endDate);
                  const isRange = isInRange(date, startDate, endDate);
                  const isToday = isSameDay(date, today);

                  return (
                    <Pressable
                      key={date.toISOString()}
                      style={[
                        styles.dayCell,
                        isRange && styles.dayCellInRange,
                        isStart && styles.dayCellStart,
                        isEnd && styles.dayCellEnd,
                        (isStart || isEnd) && styles.dayCellSelected,
                      ]}
                      onPress={() => handleDayPress(date)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isDisabled && styles.dayTextDisabled,
                          isToday && styles.dayTextToday,
                          (isStart || isEnd) && styles.dayTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Selected Dates Display */}
            <View style={styles.selectedDatesContainer}>
              <View style={styles.selectedDate}>
                <Text style={styles.selectedDateLabel}>Start</Text>
                <Text style={styles.selectedDateValue}>
                  {startDate ? formatDate(startDate) : "Select date"}
                </Text>
              </View>
              <Text style={styles.selectedDateArrow}>→</Text>
              <View style={styles.selectedDate}>
                <Text style={styles.selectedDateLabel}>End</Text>
                <Text style={styles.selectedDateValue}>
                  {endDate ? formatDate(endDate) : "Select date"}
                </Text>
              </View>
            </View>

            {/* Confirm Button */}
            <Pressable
              style={[
                styles.confirmButton,
                !startDate && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!startDate}
            >
              <Text style={styles.confirmButtonText}>
                {startDate && endDate
                  ? `Confirm (${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days)`
                  : startDate
                  ? "Confirm (1 day)"
                  : "Select Dates"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1e3a5f",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  shortcutsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shortcutButton: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  shortcutButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  shortcutText: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "500",
  },
  shortcutTextDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
  durationsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  durationButtonSelected: {
    backgroundColor: "#3b82f6",
  },
  durationText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  durationTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  navButtonText: {
    color: "white",
    fontSize: 24,
    lineHeight: 28,
  },
  navButtonTextDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekdayText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "500",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellInRange: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  dayCellStart: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  dayCellEnd: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: "#3b82f6",
    borderRadius: 20,
  },
  dayText: {
    color: "white",
    fontSize: 16,
  },
  dayTextDisabled: {
    color: "rgba(255,255,255,0.2)",
  },
  dayTextToday: {
    fontWeight: "bold",
    color: "#60a5fa",
  },
  dayTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  selectedDatesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 16,
  },
  selectedDate: {
    alignItems: "center",
  },
  selectedDateLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 4,
  },
  selectedDateValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedDateArrow: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 20,
  },
  confirmButton: {
    backgroundColor: "#3b82f6",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
