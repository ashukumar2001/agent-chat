import React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Light mode with bright colors",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Dark mode with muted colors",
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follows your system preference",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of the application.
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <h4 className="text-sm font-medium mb-3">Theme</h4>
        <div className="grid grid-cols-1 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                  isSelected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
