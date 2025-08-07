import { Link, useLocation } from "wouter";
import { Home, PillBottle, Calendar, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/medications", label: "Medications", icon: PillBottle },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/journal", label: "Journal", icon: BookOpen },
];

export default function TabNavigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 notepad-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location === tab.path;
            
            return (
              <Link key={tab.path} href={tab.path}>
                <button
                  className={cn(
                    "border-b-2 py-4 px-1 text-sm font-medium transition-colors",
                    isActive
                      ? "border-app-blue text-app-blue"
                      : "border-transparent text-gray-500 hover:text-app-blue hover:border-app-bronze"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2 inline" />
                  {tab.label}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
