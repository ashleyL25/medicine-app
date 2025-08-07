import { useQuery } from "@tanstack/react-query";
import { PillBottle, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getCurrentCyclePhase } from "@/lib/cycle-utils";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();
  const { data: currentCycle } = useQuery({
    queryKey: ["/api/cycle-tracking/current"],
  });

  const cycleInfo = getCurrentCyclePhase(currentCycle);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white notepad-shadow sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-app-blue rounded-full flex items-center justify-center">
              <PillBottle className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-app-blue">FemCare</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="cycle-indicator px-4 py-2 rounded-full text-sm font-medium text-app-blue">
              <span>{cycleInfo}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="w-10 h-10 bg-app-bronze rounded-full p-0">
                  <User className="text-white w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-sm text-gray-600">
                  {user?.email || "User"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
