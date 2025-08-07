import { Medication, MedicationLog } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, X } from "lucide-react";
import PillIcon from "./pill-icon";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MedicationCardProps {
  medication: Medication;
  log?: MedicationLog;
  onCheck?: (checked: boolean) => void;
  onSkip?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewProfile?: () => void;
  showActions?: boolean;
  className?: string;
}

export default function MedicationCard({
  medication,
  log,
  onCheck,
  onSkip,
  onEdit,
  onDelete,
  onViewProfile,
  showActions = true,
  className,
}: MedicationCardProps) {
  const nextRefillDate = medication.purchaseDate && medication.daysSupply 
    ? new Date(medication.purchaseDate.getTime() + medication.daysSupply * 24 * 60 * 60 * 1000)
    : null;

  const daysUntilRefill = nextRefillDate 
    ? Math.ceil((nextRefillDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  const supplyPercentage = medication.purchaseDate && medication.daysSupply
    ? Math.max(0, Math.min(100, (daysUntilRefill || 0) / medication.daysSupply * 100))
    : 0;

  const isSkipped = log?.skipped;
  const isTaken = log?.taken;

  return (
    <Card 
      className={cn(
        "medication-card notepad-shadow p-6 cursor-pointer",
        isSkipped && "opacity-50",
        className
      )}
      onClick={onViewProfile}
    >
      <div className="flex items-start justify-between mb-4">
        {medication.imageUrl ? (
          <img 
            src={medication.imageUrl} 
            alt={medication.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-app-light-bronze rounded-xl flex items-center justify-center">
            <PillIcon className="text-app-bronze w-8 h-8" />
          </div>
        )}
        
        {showActions && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-app-bronze p-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-red-500 p-1"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1 mb-3">
        <h3 className={cn(
          "font-semibold text-gray-900",
          isSkipped && "line-through"
        )}>
          {medication.name}
        </h3>
        <p className="text-sm text-gray-600">
          {medication.brand && `${medication.brand} • `}
          {medication.strength}
        </p>
        <p className="text-xs text-app-bronze">
          {medication.purpose}
        </p>
        {isSkipped && log?.skipReason && (
          <p className="text-xs text-red-500">
            Skipped - {log.skipReason}
          </p>
        )}
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Frequency:</span>
          <span className="font-medium">{medication.frequency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Time:</span>
          <span className="font-medium">{medication.timeOfDay}</span>
        </div>
        {daysUntilRefill !== null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Next refill:</span>
            <span className={cn(
              "font-medium",
              daysUntilRefill <= 3 ? "text-red-600" :
              daysUntilRefill <= 7 ? "text-yellow-600" : "text-green-600"
            )}>
              {daysUntilRefill <= 0 ? "Overdue" : `${daysUntilRefill} days`}
            </span>
          </div>
        )}
      </div>

      {medication.daysSupply && (
        <div className="pt-4 border-t border-gray-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Supply remaining:</span>
            <span className="text-sm font-medium">{Math.round(supplyPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all",
                supplyPercentage <= 10 ? "bg-red-500" :
                supplyPercentage <= 30 ? "bg-yellow-500" : "bg-app-bronze"
              )}
              style={{ width: `${supplyPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons for homepage medication checklist */}
      {(onCheck || onSkip) && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {onSkip && (
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-red-500 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {onCheck && (
              <Checkbox
                checked={isTaken}
                onCheckedChange={(checked) => {
                  onCheck(checked as boolean);
                }}
                className="check-animation"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
          {isSkipped && (
            <span className="text-red-500 text-sm">Crossed out</span>
          )}
        </div>
      )}

      {/* Action buttons for medication management */}
      {showActions && (onEdit || onDelete) && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="text-app-bronze hover:text-app-blue p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-red-500 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
