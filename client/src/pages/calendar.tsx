import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { getCurrentCycleDay, shouldTakeMedication } from "@/lib/cycle-utils";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Medication, MedicationLog, CycleTracking, JournalEntry } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodStartDate, setPeriodStartDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: currentCycle } = useQuery<CycleTracking | null>({
    queryKey: ["/api/cycle-tracking/current"],
  });

  const { data: medicationLogs = [] } = useQuery<MedicationLog[]>({
    queryKey: ["/api/medication-logs", currentDate],
  });

  const { data: selectedDateJournal } = useQuery<JournalEntry | null>({
    queryKey: ["/api/journal-entries/date", selectedDate?.toISOString().split('T')[0]],
    enabled: !!selectedDate,
  });

  const currentCycleDay = getCurrentCycleDay(currentCycle);

  // Calculate date ranges based on view mode
  const getDateRange = () => {
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // Add padding days for calendar grid
      const startDate = new Date(monthStart);
      startDate.setDate(startDate.getDate() - monthStart.getDay());
      
      const endDate = new Date(monthEnd);
      endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
      
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
  };

  const allCalendarDays = getDateRange();

  const getDayMedications = (date: Date) => {
    const cycleDay = getCurrentCycleDayForDate(date, currentCycle);
    return medications.filter((med: Medication) => 
      shouldTakeMedication(med.frequency, cycleDay)
    );
  };

  const getDayLogs = (date: Date) => {
    return medicationLogs.filter((log: MedicationLog) => 
      isSameDay(new Date(log.date), date)
    );
  };

  const getCyclePhase = (date: Date, cycle?: CycleTracking | null) => {
    if (!cycle) return null;
    
    const cycleDay = getCurrentCycleDayForDate(date, cycle);
    if (!cycleDay) return null;

    if (cycleDay <= 5) return 'period';
    if (cycleDay <= 13) return 'follicular';
    if (cycleDay <= 15) return 'ovulation';
    return 'luteal';
  };

  const trackPeriod = useMutation({
    mutationFn: async (startDate: string) => {
      return await apiRequest("POST", "/api/cycle-tracking", {
        lastPeriodStart: new Date(startDate),
        averageCycleLength: 28,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cycle-tracking/current"] });
      toast({
        title: "Period Tracked",
        description: "Your period start date has been recorded",
      });
      setShowPeriodModal(false);
      setPeriodStartDate("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to track period",
        variant: "destructive",
      });
    },
  });

  const handleTrackPeriod = () => {
    if (!periodStartDate) {
      toast({
        title: "Date Required",
        description: "Please select your period start date",
        variant: "destructive",
      });
      return;
    }
    trackPeriod.mutate(periodStartDate);
  };

  const previousPeriod = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-app-blue">Medication Calendar</h2>
        <div className="flex items-center space-x-4">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="pill-button bg-app-light-bronze text-app-bronze border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setShowPeriodModal(true)}
            className="pill-button bg-app-bronze text-white hover:bg-app-bronze/90"
          >
            Track Period
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card className="notepad-shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-app-blue">
            {viewMode === "week" 
              ? `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </h3>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousPeriod}
              className="text-gray-400 hover:text-app-bronze"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="pill-button bg-app-light-bronze text-app-bronze border-0"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPeriod}
              className="text-gray-400 hover:text-app-bronze"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={cn(
          "grid gap-px bg-gray-200 rounded-xl overflow-hidden",
          viewMode === "week" ? "grid-cols-7" : "grid-cols-7"
        )}>
          {/* Days of week header */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-app-light-bronze p-3 text-center text-sm font-medium text-app-blue">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {allCalendarDays.map((date) => {
            const dayMedications = getDayMedications(date);
            const dayLogs = getDayLogs(date);
            const cyclePhase = getCyclePhase(date, currentCycle);
            const isCurrentMonth = viewMode === "week" || isSameMonth(date, currentDate);
            const isDayToday = isToday(date);

            return (
              <div
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "bg-white p-3 relative cursor-pointer hover:bg-gray-50",
                  viewMode === "week" ? "h-32" : "h-24",
                  isDayToday && "bg-app-light-bronze border-2 border-app-bronze",
                  !isCurrentMonth && "text-gray-400"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-sm",
                    isDayToday ? "font-medium text-app-blue" : 
                    isCurrentMonth ? "font-medium" : ""
                  )}>
                    {format(date, viewMode === "week" ? 'MMM d' : 'd')}
                  </span>
                  
                  {isDayToday && (
                    <span className="text-xs font-medium text-app-bronze">
                      Today
                    </span>
                  )}
                </div>

                {/* Week view - show medication list */}
                {viewMode === "week" && dayMedications.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dayMedications.slice(0, 3).map((med: Medication) => (
                      <div key={med.id} className="text-xs bg-app-light-bronze text-app-blue px-2 py-1 rounded truncate">
                        {med.name}
                      </div>
                    ))}
                    {dayMedications.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayMedications.length - 3} more
                      </div>
                    )}
                  </div>
                )}

                {/* Cycle indicators */}
                <div className="absolute bottom-1 left-1 flex space-x-1">
                  {cyclePhase === 'period' && (
                    <div className="w-2 h-2 bg-red-400 rounded-full" title="Period day" />
                  )}
                  {cyclePhase === 'ovulation' && (
                    <div className="w-2 h-2 bg-green-400 rounded-full" title="Ovulation" />
                  )}
                  {dayMedications.length > 0 && viewMode === "month" && (
                    <div className="w-2 h-2 bg-app-bronze rounded-full" title="Medications scheduled" />
                  )}
                  {dayLogs.some(log => log.taken) && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full" title="Medications taken" />
                  )}
                  {dayLogs.some(log => log.skipped) && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Medications skipped" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <span>Period</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full" />
            <span>Ovulation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-app-bronze rounded-full" />
            <span>Medications Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
            <span>Medications Taken</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <span>Medications Skipped</span>
          </div>
        </div>
      </Card>

      {/* Day Detail Modal */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDate && (
            <div className="space-y-6">
              {/* Medications for this day */}
              <div>
                <h4 className="font-semibold text-app-blue mb-3">Scheduled Medications</h4>
                {getDayMedications(selectedDate).length > 0 ? (
                  <div className="space-y-2">
                    {getDayMedications(selectedDate).map((med: Medication) => (
                      <div key={med.id} className="flex items-center justify-between p-3 bg-app-light-bronze rounded-lg">
                        <div>
                          <span className="font-medium text-app-blue">{med.name}</span>
                          <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                        </div>
                        {getDayLogs(selectedDate).find(log => log.medicationId === med.id) && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            Logged
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No medications scheduled for this day</p>
                )}
              </div>

              {/* Journal entry for this day */}
              <div>
                <h4 className="font-semibold text-app-blue mb-3">Journal Entry</h4>
                {selectedDateJournal ? (
                  <div className="p-4 bg-white border rounded-lg">
                    {selectedDateJournal.mood && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Mood: </span>
                        <span className="font-medium capitalize">{selectedDateJournal.mood}</span>
                      </div>
                    )}
                    {selectedDateJournal.symptoms && selectedDateJournal.symptoms.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Symptoms: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedDateJournal.symptoms.map((symptom, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedDateJournal.notes && (
                      <div>
                        <span className="text-sm text-gray-600">Notes: </span>
                        <p className="mt-1 text-gray-800">{selectedDateJournal.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No journal entry for this day</p>
                )}
              </div>

              {/* Cycle information */}
              {getCyclePhase(selectedDate, currentCycle) && (
                <div>
                  <h4 className="font-semibold text-app-blue mb-3">Cycle Information</h4>
                  <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                    <span className="capitalize font-medium">
                      {getCyclePhase(selectedDate, currentCycle)} Phase
                    </span>
                    {getCurrentCycleDayForDate(selectedDate, currentCycle) && (
                      <span className="ml-2 text-sm text-gray-600">
                        (Day {getCurrentCycleDayForDate(selectedDate, currentCycle)})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Period Tracking Modal */}
      <Dialog open={showPeriodModal} onOpenChange={setShowPeriodModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Track Your Period</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="period-date" className="text-sm font-medium text-gray-700">
                Period Start Date
              </Label>
              <Input
                id="period-date"
                type="date"
                value={periodStartDate}
                onChange={(e) => setPeriodStartDate(e.target.value)}
                className="mt-1 rounded-xl border-gray-200 focus:ring-app-bronze focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the first day of your most recent period
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPeriodModal(false);
                  setPeriodStartDate("");
                }}
                className="pill-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTrackPeriod}
                disabled={trackPeriod.isPending || !periodStartDate}
                className="pill-button bg-app-bronze text-white hover:bg-app-bronze/90"
              >
                {trackPeriod.isPending ? "Saving..." : "Track Period"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// Helper function to get cycle day for a specific date
function getCurrentCycleDayForDate(date: Date, cycle?: CycleTracking | null): number | null {
  if (!cycle) return null;

  const cycleStartDate = cycle.periodStartDate;
  const daysSinceStart = Math.floor((date.getTime() - cycleStartDate.getTime()) / (24 * 60 * 60 * 1000));
  const cycleLength = cycle.cycleLength || 28;
  
  if (daysSinceStart < 0) return null;
  
  return ((daysSinceStart % cycleLength) + 1);
}
