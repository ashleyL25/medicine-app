import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { insertMedicationSchema, type InsertMedication } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PillIcon from "./pill-icon";
import { Upload } from "lucide-react";
import { z } from "zod";

// Form schema for the UI (handles strings)
const medicationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  strength: z.string().min(1, "Strength is required"),
  form: z.string().optional(),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  timeOfDay: z.string().optional(),
  purpose: z.string().optional(),
  category: z.string().optional(),
  bottleSize: z.string().optional(),
  purchaseDate: z.string().or(z.date()).optional().transform((val) => {
    if (!val || val === "") return "";
    if (typeof val === "string") return val;
    return val.toISOString().split('T')[0];
  }),
  daysSupply: z.string().optional(),
  doctor: z.string().optional(),
  cost: z.string().optional(),
  pharmacy: z.string().optional(),
  sideEffects: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

type MedicationFormData = z.infer<typeof medicationFormSchema>;

interface AddMedicationModalProps {
  open: boolean;
  onClose: () => void;
  editingMedication?: any;
}

export default function AddMedicationModal({ open, onClose, editingMedication }: AddMedicationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const getDefaultValues = () => {
    if (editingMedication) {
      return {
        name: editingMedication.name || "",
        brand: editingMedication.brand || "",
        strength: editingMedication.strength || "",
        form: editingMedication.form || "",
        dosage: editingMedication.dosage || "",
        frequency: editingMedication.frequency || "",
        timeOfDay: editingMedication.timeOfDay || "",
        purpose: editingMedication.purpose || "",
        category: editingMedication.category || "",
        bottleSize: editingMedication.bottleSize ? String(editingMedication.bottleSize) : "",
        purchaseDate: editingMedication.purchaseDate ? new Date(editingMedication.purchaseDate).toISOString().split('T')[0] : "",
        daysSupply: editingMedication.daysSupply ? String(editingMedication.daysSupply) : "",
        doctor: editingMedication.doctor || "",
        cost: editingMedication.cost || "",
        pharmacy: editingMedication.pharmacy || "",
        sideEffects: editingMedication.sideEffects || "",
        notes: editingMedication.notes || "",
        imageUrl: editingMedication.imageUrl || "",
      };
    }
    return {
      name: "",
      brand: "",
      strength: "",
      form: "",
      dosage: "",
      frequency: "",
      timeOfDay: "",
      purpose: "",
      category: "",
      bottleSize: "",
      purchaseDate: "",
      daysSupply: "",
      doctor: "",
      cost: "",
      pharmacy: "",
      sideEffects: "",
      notes: "",
      imageUrl: "",
    };
  };

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when editing medication changes
  useEffect(() => {
    if (open) {
      const defaultValues = getDefaultValues();
      form.reset(defaultValues);
      setImagePreview(editingMedication?.imageUrl || "");
      setImageFile(null);
    }
  }, [open, editingMedication]);

  const createMedication = useMutation({
    mutationFn: async (data: InsertMedication) => {
      if (editingMedication) {
        const response = await apiRequest("PATCH", `/api/medications/${editingMedication.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/medications", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Success",
        description: editingMedication ? "Medication updated successfully" : "Medication added successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: editingMedication ? "Failed to update medication" : "Failed to add medication",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: MedicationFormData) => {
    // Convert form data to InsertMedication format
    const processedData: InsertMedication = {
      name: data.name,
      brand: data.brand || null,
      strength: data.strength,
      form: data.form || null,
      dosage: data.dosage,
      frequency: data.frequency,
      timeOfDay: data.timeOfDay || null,
      purpose: data.purpose || null,
      category: data.category || null,
      bottleSize: data.bottleSize ? Number(data.bottleSize) : null,
      purchaseDate: data.purchaseDate && data.purchaseDate !== "" ? new Date(data.purchaseDate) : null,
      daysSupply: data.daysSupply ? Number(data.daysSupply) : null,
      doctor: data.doctor || null,
      cost: data.cost || null,
      pharmacy: data.pharmacy || null,
      sideEffects: data.sideEffects || null,
      notes: data.notes || null,
      imageUrl: imagePreview || data.imageUrl || null,
    };
    createMedication.mutate(processedData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-app-blue">
            {editingMedication ? "Edit Medication" : "Add New Medication"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Image Upload */}
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-2xl bg-app-light-bronze flex items-center justify-center mb-4 overflow-hidden">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Medication" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PillIcon className="text-app-bronze w-16 h-16" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="pill-button"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    {imagePreview && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setImagePreview("");
                          setImageFile(null);
                        }}
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medication Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Vitamin D3" 
                            className="rounded-xl" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Nature Made" 
                            className="rounded-xl" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strength/Dose *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 2000 IU" 
                            className="rounded-xl" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="form"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select form..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tablet">Tablet</SelectItem>
                            <SelectItem value="capsule">Capsule</SelectItem>
                            <SelectItem value="softgel">Softgel</SelectItem>
                            <SelectItem value="liquid">Liquid</SelectItem>
                            <SelectItem value="powder">Powder</SelectItem>
                            <SelectItem value="gummy">Gummy</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Dosage Information */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How Much *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 1 capsule, 2 tablets" 
                            className="rounded-xl" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select frequency..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="every-other-day">Every other day</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="as-needed">As needed</SelectItem>
                            <SelectItem value="cycle-days-1-14">Cycle days 1-14</SelectItem>
                            <SelectItem value="cycle-days-15-28">Cycle days 15-28</SelectItem>
                            <SelectItem value="during-period">During period</SelectItem>
                            <SelectItem value="custom">Custom schedule</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeOfDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time of Day</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select time..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="evening">Evening</SelectItem>
                            <SelectItem value="before-bed">Before bed</SelectItem>
                            <SelectItem value="with-meals">With meals</SelectItem>
                            <SelectItem value="between-meals">Between meals</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose/Reason</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Bone health & immunity" 
                            className="rounded-xl" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vitamin">Vitamin</SelectItem>
                          <SelectItem value="mineral">Mineral</SelectItem>
                          <SelectItem value="supplement">Supplement</SelectItem>
                          <SelectItem value="prescription">Prescription</SelectItem>
                          <SelectItem value="hormone-support">Hormone Support</SelectItem>
                          <SelectItem value="cycle-support">Cycle Support</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Supply Information */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-app-blue mb-4">Supply Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bottleSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bottle/Pack Size</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 180" 
                          className="rounded-xl" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="rounded-xl" 
                          {...field}
                          value={field.value ? field.value.toISOString().split('T')[0] : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="daysSupply"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days Supply</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Auto-calculated" 
                          className="rounded-xl" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h4 className="text-lg font-semibold text-app-blue mb-4">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="doctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor/Provider</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Dr. Sarah Johnson" 
                          className="rounded-xl" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., $24.99" 
                          className="rounded-xl" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pharmacy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pharmacy/Store</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Walgreens" 
                          className="rounded-xl" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sideEffects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Side Effects</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., None known" 
                          className="rounded-xl" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this medication..." 
                        className="rounded-xl resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="pill-button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="pill-button bg-app-bronze hover:bg-app-bronze/90"
                disabled={createMedication.isPending}
              >
                {createMedication.isPending ? "Adding..." : "Add Medication"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
