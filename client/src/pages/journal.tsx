import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Plus, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { getCurrentCycleDay } from "@/lib/cycle-utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertJournalEntrySchema, type InsertJournalEntry, type JournalEntry, type CycleTracking } from "@shared/schema";
import { z } from "zod";

const journalFormSchema = z.object({
  date: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  mood: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  notes: z.string().optional(),
  cycleDay: z.number().optional(),
});

type JournalFormData = z.infer<typeof journalFormSchema>;

const moodOptions = [
  { emoji: "😊", label: "Great", value: "great" },
  { emoji: "🙂", label: "Good", value: "good" },
  { emoji: "😐", label: "Okay", value: "okay" },
  { emoji: "😔", label: "Low", value: "low" },
  { emoji: "😷", label: "Unwell", value: "unwell" },
];

const symptomOptions = [
  "Cramps", "Headache", "Bloating", "Fatigue", "Mood swings",
  "High energy", "Acne", "Sleep issues", "Breast tenderness",
  "Back pain", "Nausea", "Dizziness"
];

export default function Journal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();

  const { data: currentCycle } = useQuery<CycleTracking | null>({
    queryKey: ["/api/cycle-tracking/current"],
  });

  const { data: journalEntries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/journal-entries?limit=10");
      return await response.json();
    },
  });

  const { data: todaysEntry } = useQuery<JournalEntry | null>({
    queryKey: ["/api/journal-entries/date", today.toISOString().split('T')[0]],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/journal-entries/date/${today.toISOString().split('T')[0]}`);
        return await response.json();
      } catch (error) {
        return null;
      }
    },
  });

  const currentCycleDay = getCurrentCycleDay(currentCycle);

  const form = useForm<JournalFormData>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      date: today,
      mood: todaysEntry?.mood || "",
      symptoms: todaysEntry?.symptoms || [],
      notes: todaysEntry?.notes || "",
      cycleDay: currentCycleDay || undefined,
    },
  });

  const saveJournalEntry = useMutation({
    mutationFn: async (data: JournalFormData) => {
      const payload: InsertJournalEntry = {
        date: data.date,
        mood: data.mood || null,
        symptoms: data.symptoms,
        notes: data.notes || null,
        cycleDay: data.cycleDay || null,
      };
      
      if (todaysEntry) {
        return await apiRequest("PATCH", `/api/journal-entries/${todaysEntry.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/journal-entries", payload);
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JournalFormData) => {
    saveJournalEntry.mutate(data);
  };

  const toggleSymptom = (symptom: string) => {
    const currentSymptoms = form.getValues("symptoms");
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter(s => s !== symptom)
      : [...currentSymptoms, symptom];
    form.setValue("symptoms", newSymptoms);
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-300 rounded w-48"></div>
            <div className="h-10 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="bg-white rounded-2xl h-96"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-app-blue">Daily Journal</h2>
        <Button className="pill-button bg-app-bronze text-white hover:bg-app-bronze/90">
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Today's Entry */}
      <Card className="notepad-shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-app-blue">
            Today - {format(today, 'MMMM d, yyyy')}
          </h3>
          {currentCycleDay && (
            <span className="pill-button bg-green-100 text-green-800 px-3 py-1 text-sm">
              Cycle Day {currentCycleDay}
            </span>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Mood Selection */}
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    How are you feeling?
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {moodOptions.map((mood) => (
                        <Button
                          key={mood.value}
                          type="button"
                          variant={field.value === mood.value ? "default" : "outline"}
                          className={`pill-button flex flex-col items-center space-y-1 h-auto py-3 ${
                            field.value === mood.value
                              ? "bg-app-bronze text-white"
                              : "bg-app-light-bronze text-app-bronze hover:bg-app-bronze hover:text-white"
                          }`}
                          onClick={() => field.onChange(mood.value)}
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                          <span className="text-sm">{mood.label}</span>
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Symptoms Tracking */}
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Any symptoms today?
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {symptomOptions.map((symptom) => (
                        <label
                          key={symptom}
                          className="flex items-center space-x-2 p-3 rounded-xl border-2 border-gray-200 hover:border-app-bronze cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={field.value.includes(symptom)}
                            onCheckedChange={() => toggleSymptom(symptom)}
                            className="text-app-bronze"
                          />
                          <span className="text-sm">{symptom}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How are you feeling today? Any thoughts about your health, cycle, or medications..."
                      className="rounded-xl border-gray-200 focus:ring-app-bronze focus:border-transparent resize-none"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saveJournalEntry.isPending}
                className="pill-button bg-app-bronze text-white hover:bg-app-bronze/90"
              >
                {saveJournalEntry.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      {/* Previous Entries */}
      <Card className="notepad-shadow p-6">
        <h3 className="text-xl font-semibold text-app-blue mb-6">Previous Entries</h3>
        
        {journalEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No journal entries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journalEntries.map((entry: JournalEntry) => {
              const entryDate = new Date(entry.date);
              const moodData = moodOptions.find(m => m.value === entry.mood);
              
              return (
                <div key={entry.id} className="border-l-4 border-app-bronze pl-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {format(entryDate, 'MMMM d, yyyy')}
                    </h4>
                    {entry.cycleDay && (
                      <span className="text-sm text-gray-500">
                        Cycle Day {entry.cycleDay}
                      </span>
                    )}
                  </div>
                  
                  {entry.mood && moodData && (
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm text-gray-600">Mood:</span>
                      <span className="text-lg">{moodData.emoji}</span>
                      <span className="text-sm text-app-bronze">{moodData.label}</span>
                    </div>
                  )}
                  
                  {entry.notes && (
                    <p className="text-sm text-gray-700 mb-2">{entry.notes}</p>
                  )}
                  
                  {entry.symptoms && entry.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.symptoms.map((symptom: string) => (
                        <span
                          key={symptom}
                          className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {journalEntries.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="pill-button bg-app-light-bronze text-app-bronze hover:bg-app-bronze hover:text-white"
            >
              View All Entries
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
