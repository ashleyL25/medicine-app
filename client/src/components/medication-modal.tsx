import { Medication } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PillIcon from "./pill-icon";
import { format } from "date-fns";

interface MedicationModalProps {
  medication: Medication | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onOrderRefill: () => void;
}

export default function MedicationModal({
  medication,
  open,
  onClose,
  onEdit,
  onOrderRefill,
}: MedicationModalProps) {
  if (!medication) return null;

  const nextRefillDate = medication.purchaseDate && medication.daysSupply 
    ? new Date(medication.purchaseDate.getTime() + medication.daysSupply * 24 * 60 * 60 * 1000)
    : null;

  const daysUntilRefill = nextRefillDate 
    ? Math.ceil((nextRefillDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-app-blue">
            {medication.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Medication Image */}
            <div className="text-center">
              {medication.imageUrl ? (
                <img 
                  src={medication.imageUrl} 
                  alt={medication.name}
                  className="w-32 h-32 mx-auto rounded-2xl object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 mx-auto bg-app-light-bronze rounded-2xl flex items-center justify-center mb-4">
                  <PillIcon className="text-app-bronze w-16 h-16" />
                </div>
              )}
              <Button variant="outline" size="sm" className="pill-button">
                Change Image
              </Button>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name
                </label>
                <p className="text-gray-900 font-medium">{medication.name}</p>
              </div>
              {medication.brand && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <p className="text-gray-900">{medication.brand}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strength
                </label>
                <p className="text-gray-900">{medication.strength}</p>
              </div>
              {medication.form && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form
                  </label>
                  <p className="text-gray-900">{medication.form}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Dosage Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <p className="text-gray-900">{medication.dosage}</p>
              </div>
              {medication.timeOfDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <p className="text-gray-900">{medication.timeOfDay}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <p className="text-gray-900">{medication.frequency}</p>
              </div>
              {medication.purpose && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose
                  </label>
                  <p className="text-gray-900">{medication.purpose}</p>
                </div>
              )}
            </div>

            {/* Supply Info */}
            <div className="space-y-4">
              {medication.bottleSize && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bottle Size
                  </label>
                  <p className="text-gray-900">{medication.bottleSize} {medication.form || 'units'}</p>
                </div>
              )}
              {medication.purchaseDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchased Date
                  </label>
                  <p className="text-gray-900">
                    {format(medication.purchaseDate, 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
              {medication.daysSupply && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Days Supply
                  </label>
                  <p className="text-gray-900">{medication.daysSupply} days</p>
                </div>
              )}
              {nextRefillDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Order Date
                  </label>
                  <p className={`font-medium ${
                    daysUntilRefill && daysUntilRefill <= 3 ? 'text-red-600' : 
                    daysUntilRefill && daysUntilRefill <= 7 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {format(nextRefillDate, 'MMMM d, yyyy')} 
                    {daysUntilRefill !== null && (
                      <span className="ml-1">
                        ({daysUntilRefill <= 0 ? 'Overdue' : `${daysUntilRefill} days`})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Fields */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {medication.doctor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor/Provider
                </label>
                <p className="text-gray-900">{medication.doctor}</p>
              </div>
            )}
            {medication.cost && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <p className="text-gray-900">{medication.cost}</p>
              </div>
            )}
            {medication.pharmacy && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pharmacy/Store
                </label>
                <p className="text-gray-900">{medication.pharmacy}</p>
              </div>
            )}
            {medication.sideEffects && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Side Effects
                </label>
                <p className="text-gray-900">{medication.sideEffects}</p>
              </div>
            )}
          </div>
          
          {medication.notes && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <p className="text-gray-900">{medication.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={onEdit}
            className="pill-button"
          >
            Edit
          </Button>
          <Button 
            onClick={onOrderRefill}
            className="pill-button bg-app-bronze hover:bg-app-bronze/90"
          >
            Order Refill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
