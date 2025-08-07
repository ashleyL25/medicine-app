import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import MedicationCard from "@/components/medication-card";
import MedicationModal from "@/components/medication-modal";
import AddMedicationModal from "@/components/add-medication-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Medication } from "@shared/schema";

export default function Medications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ["/api/medications"],
  });

  const deleteMedication = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/medications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Success",
        description: "Medication deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete medication",
        variant: "destructive",
      });
    },
  });

  // Filter medications
  const filteredMedications = (medications as Medication[]).filter((med: Medication) => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (med.brand && med.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || med.category === categoryFilter;
    
    // Handle cycle-based frequency filtering
    let matchesFrequency = true;
    if (frequencyFilter !== "all") {
      if (frequencyFilter === "cycle-based") {
        // Check if it's any cycle-based frequency
        matchesFrequency = Boolean(med.frequency && (
          med.frequency.includes("cycle-days") || 
          med.frequency === "during-period"
        ));
      } else {
        matchesFrequency = med.frequency === frequencyFilter;
      }
    }
    
    return matchesSearch && matchesCategory && matchesFrequency;
  });

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setSelectedMedication(null); // Close detail modal if open
  };

  const handleDelete = (medication: Medication) => {
    if (confirm(`Are you sure you want to delete ${medication.name}?`)) {
      deleteMedication.mutate(medication.id);
    }
  };

  const handleOrderRefill = (medication: Medication) => {
    // TODO: Implement order refill functionality
    toast({
      title: "Coming Soon",
      description: "Order refill functionality will be available soon",
    });
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-300 rounded w-48"></div>
            <div className="h-10 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="bg-white rounded-2xl h-24"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-app-blue">All Medications</h2>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="pill-button bg-app-bronze text-white hover:bg-app-bronze/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Filter Options */}
      <Card className="notepad-shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="pill-button bg-app-light-bronze text-app-bronze border-0">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="vitamin">Vitamins</SelectItem>
              <SelectItem value="supplement">Supplements</SelectItem>
              <SelectItem value="prescription">Prescription</SelectItem>
              <SelectItem value="cycle-support">Cycle Support</SelectItem>
            </SelectContent>
          </Select>

          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger className="pill-button bg-app-light-bronze text-app-bronze border-0">
              <SelectValue placeholder="All Frequencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="as-needed">As Needed</SelectItem>
              <SelectItem value="cycle-based">Cycle Based</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-bronze w-4 h-4" />
            <Input
              type="search"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pill-button bg-app-light-bronze text-app-bronze border-0 pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Medications Grid */}
      {filteredMedications.length === 0 ? (
        <Card className="notepad-shadow p-12 text-center">
          <div className="text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-app-light-bronze rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-app-bronze" />
            </div>
            <h3 className="text-lg font-medium mb-2">No medications found</h3>
            <p className="mb-4">
              {searchTerm || categoryFilter !== "all" || frequencyFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "Start by adding your first medication"}
            </p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="pill-button bg-app-bronze text-white hover:bg-app-bronze/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedications.map((medication: Medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onEdit={() => handleEdit(medication)}
              onDelete={() => handleDelete(medication)}
              onViewProfile={() => setSelectedMedication(medication)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <MedicationModal
        medication={selectedMedication}
        open={!!selectedMedication}
        onClose={() => setSelectedMedication(null)}
        onEdit={() => handleEdit(selectedMedication!)}
        onOrderRefill={() => handleOrderRefill(selectedMedication!)}
      />

      <AddMedicationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <AddMedicationModal
        open={!!editingMedication}
        onClose={() => setEditingMedication(null)}
        editingMedication={editingMedication}
      />
    </main>
  );
}
