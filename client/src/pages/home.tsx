import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Bell, BookOpen, Plus, PillBottle } from "lucide-react";
import { format } from "date-fns";
import { getGreeting, formatDateShort } from "@/lib/date-utils";
import { getCurrentCycleDay, shouldTakeMedication } from "@/lib/cycle-utils";
import MedicationCard from "@/components/medication-card";
import AddMedicationModal from "@/components/add-medication-modal";
import UserProfileModal from "@/components/user-profile-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import type { Medication, MedicationLog, CycleTracking, JournalEntry } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const today = new Date();
  const [journalMood, setJournalMood] = useState<string>("");
  const [journalNotes, setJournalNotes] = useState<string>("");
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  const { data: medications = [], isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: currentCycle } = useQuery<CycleTracking>({
    queryKey: ["/api/cycle-tracking/current"],
  });

  const { data: medicationLogs = [] } = useQuery<MedicationLog[]>({
    queryKey: ["/api/medication-logs", { date: today.toISOString().split('T')[0] }],
  });

  const { data: todaysJournal } = useQuery<JournalEntry>({
    queryKey: ["/api/journal-entries/date", today.toISOString().split('T')[0]],
  });

  const currentCycleDay = getCurrentCycleDay(currentCycle);

  // Filter medications for today based on cycle and frequency
  const todayMedications = medications.filter((med: Medication) => 
    shouldTakeMedication(med.frequency, currentCycleDay)
  );

  // Group medications by time of day
  const medicationsByTime = todayMedications.reduce((acc: Record<string, Medication[]>, med: Medication) => {
    const timeGroup = med.timeOfDay || 'Other';
    if (!acc[timeGroup]) acc[timeGroup] = [];
    acc[timeGroup].push(med);
    return acc;
  }, {});

  const logMedication = useMutation({
    mutationFn: async ({ medicationId, taken, skipped, skipReason }: {
      medicationId: string;
      taken?: boolean;
      skipped?: boolean;
      skipReason?: string;
    }) => {
      // Find existing log for today
      const existingLog = medicationLogs.find((log: MedicationLog) => 
        log.medicationId === medicationId && 
        new Date(log.date).toDateString() === today.toDateString()
      );

      if (existingLog) {
        const response = await apiRequest("PATCH", `/api/medication-logs/${existingLog.id}`, {
          taken,
          skipped,
          skipReason,
        });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/medication-logs", {
          medicationId,
          date: today,
          taken,
          skipped,
          skipReason,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-logs"] });
    },
  });

  const saveJournalEntry = useMutation({
    mutationFn: async (data: { mood: string; notes: string }) => {
      if (todaysJournal) {
        const response = await apiRequest("PATCH", `/api/journal-entries/${todaysJournal.id}`, {
          mood: data.mood,
          notes: data.notes,
        });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/journal-entries", {
          date: today,
          mood: data.mood,
          notes: data.notes,
          cycleDay: currentCycleDay,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      // Invalidate all journal-related queries to ensure calendar updates
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries/date"] });
      toast({
        title: "Saved",
        description: "Journal entry saved successfully",
      });
    },
  });

  const handleMedicationCheck = (medicationId: string, checked: boolean) => {
    logMedication.mutate({ medicationId, taken: checked, skipped: false });
  };

  const handleMedicationSkip = (medicationId: string, reason: string = "User choice") => {
    logMedication.mutate({ medicationId, taken: false, skipped: true, skipReason: reason });
  };

  const handleJournalSave = () => {
    if (journalMood) {
      saveJournalEntry.mutate({ mood: journalMood, notes: journalNotes });
    }
  };

  // Calculate stats
  const takenCount = medicationLogs.filter((log: MedicationLog) => log.taken).length;
  const remainingCount = todayMedications.length - takenCount;
  const nextRefillDays = medications
    .filter((med: Medication) => med.purchaseDate && med.daysSupply)
    .map((med: Medication) => {
      const nextRefillDate = new Date(med.purchaseDate!.getTime() + med.daysSupply! * 24 * 60 * 60 * 1000);
      return Math.ceil((nextRefillDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    })
    .filter(days => days > 0)
    .sort((a, b) => a - b)[0] || null;

  if (medicationsLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="bg-white rounded-2xl h-48"></div>
          <div className="bg-white rounded-2xl h-96"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <Card className="notepad-shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-app-blue">
              {getGreeting()}, {user?.firstName || user?.email?.split('@')[0] || 'User'}!
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowUserProfileModal(true)}
              className="text-app-bronze hover:text-app-blue"
            >
              Edit Name
            </Button>
            <p className="text-gray-600 mt-1">
              Today is {format(today, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" 
            alt="Morning wellness routine" 
            className="w-20 h-20 rounded-2xl object-cover"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-app-light-bronze rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-app-blue">{takenCount}</div>
            <div className="text-sm text-gray-600">Taken Today</div>
          </div>
          <div className="bg-app-light-bronze rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-app-bronze">{remainingCount}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
          <div className="bg-app-light-bronze rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-app-blue">
              {nextRefillDays ? `${nextRefillDays} days` : "N/A"}
            </div>
            <div className="text-sm text-gray-600">Next Refill</div>
          </div>
        </div>
      </Card>

      {/* Today's Medications */}
      <Card className="notepad-shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-app-blue flex items-center">
            <Clock className="mr-2 text-app-bronze w-5 h-5" />
            Today's Medications
          </h3>
          <Button 
            onClick={() => setShowAddMedicationModal(true)}
            className="pill-button bg-app-bronze text-white hover:bg-app-bronze/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medication
          </Button>
        </div>

        {Object.entries(medicationsByTime).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <PillBottle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No medications scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(medicationsByTime).map(([timeGroup, meds]) => (
              <div key={timeGroup} className="border-l-4 border-app-bronze pl-4">
                <h4 className="font-medium text-gray-700 mb-3 capitalize">
                  {timeGroup} 
                  {timeGroup === 'morning' && ' (8:00 AM)'}
                  {timeGroup === 'evening' && ' (6:00 PM)'}
                </h4>
                <div className="space-y-3">
                  {meds.map((medication: Medication) => {
                    const log = medicationLogs.find((l: MedicationLog) => 
                      l.medicationId === medication.id && 
                      new Date(l.date).toDateString() === today.toDateString()
                    );
                    
                    return (
                      <MedicationCard
                        key={medication.id}
                        medication={medication}
                        log={log}
                        onCheck={(checked) => handleMedicationCheck(medication.id, checked)}
                        onSkip={() => handleMedicationSkip(medication.id)}
                        showActions={false}
                        className="bg-gray-50"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Journal Entry */}
      <Card className="notepad-shadow p-6 mb-8">
        <h3 className="text-xl font-semibold text-app-blue flex items-center mb-4">
          <BookOpen className="mr-2 text-app-bronze w-5 h-5" />
          How are you feeling today?
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { emoji: "😊", label: "Great", value: "great" },
            { emoji: "🙂", label: "Good", value: "good" },
            { emoji: "😐", label: "Okay", value: "okay" },
            { emoji: "😔", label: "Low", value: "low" },
            { emoji: "😷", label: "Unwell", value: "unwell" },
          ].map((mood) => (
            <Button
              key={mood.value}
              type="button"
              variant={journalMood === mood.value ? "default" : "outline"}
              className={`pill-button ${
                journalMood === mood.value
                  ? "bg-app-bronze text-white"
                  : "bg-app-light-bronze text-app-bronze hover:bg-app-bronze hover:text-white"
              }`}
              onClick={() => setJournalMood(mood.value)}
            >
              <span className="mr-2">{mood.emoji}</span>
              {mood.label}
            </Button>
          ))}
        </div>
        
        <Textarea
          placeholder="Add a note about how you're feeling today..."
          className="rounded-xl border-gray-200 focus:ring-app-bronze focus:border-transparent resize-none"
          rows={3}
          value={journalNotes}
          onChange={(e) => setJournalNotes(e.target.value)}
        />
        
        {(journalMood || journalNotes) && (
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleJournalSave}
              disabled={saveJournalEntry.isPending}
              className="pill-button bg-app-bronze hover:bg-app-bronze/90"
            >
              {saveJournalEntry.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        )}
      </Card>

      {/* Upcoming Reminders */}
      <Card className="notepad-shadow p-6">
        <h3 className="text-xl font-semibold text-app-blue flex items-center mb-4">
          <Bell className="mr-2 text-app-bronze w-5 h-5" />
          Upcoming Reminders
        </h3>
        
        <div className="space-y-3">
          {nextRefillDays && nextRefillDays <= 7 && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
              <div>
                <p className="font-medium text-gray-900">Medication refill needed</p>
                <p className="text-sm text-gray-600">Due in {nextRefillDays} days</p>
              </div>
              <Button className="pill-button bg-yellow-400 text-white hover:bg-yellow-500">
                Order Now
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
            <div>
              <p className="font-medium text-gray-900">Period tracking reminder</p>
              <p className="text-sm text-gray-600">
                {currentCycleDay ? `Currently on cycle day ${currentCycleDay}` : "Start tracking your cycle"}
              </p>
            </div>
            <Button 
              onClick={() => setLocation("/calendar")}
              className="pill-button bg-blue-400 text-white hover:bg-blue-500"
            >
              View Calendar
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Medication Modal */}
      <AddMedicationModal 
        open={showAddMedicationModal}
        onClose={() => setShowAddMedicationModal(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        open={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        user={user}
      />
    </main>
  );
}
