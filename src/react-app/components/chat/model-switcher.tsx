import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PROVIDERS } from "@/lib/providers";
import useUserPreferences from "@/hooks/useUserPreferences";
type ModelSwitcherProps = {
  selectedModel: string;
  handleModelChange: (model: string) => void;
};
export function ModelSwitcher({
  selectedModel,
  handleModelChange,
}: ModelSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const { isLoadingUserPreferences, models } = useUserPreferences();
  const currentModel = models.find((model) => model.id === selectedModel);
  const currentProvider = PROVIDERS.find(
    (provider) => provider.id === currentModel?.providerId
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between rounded-full"
          disabled={isLoadingUserPreferences}
        >
          {currentProvider?.icon && (
            <currentProvider.icon className="w-4 h-4" />
          )}
          {currentModel?.name || "Select model..."}

          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => {
                const provider = PROVIDERS.find(
                  (provider) => provider.id === model.providerId
                );
                return (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={(currentValue) => {
                      handleModelChange(currentValue);
                      setOpen(false);
                    }}
                    className={cn("justify-between items-center")}
                  >
                    <div className="flex items-center gap-3">
                      {provider?.icon && <provider.icon className="w-4 h-4" />}
                      {model.name}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
