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
import { MODELS } from "@worker/lib/models";
import { cn } from "@/lib/utils";
import { PROVIDERS } from "@worker/lib/provider-utils/providers";
type ModelSwitcherProps = {
  selectedModel: string;
  handleModelChange: (model: string) => void;
};
export function ModelSwitcher({
  selectedModel,
  handleModelChange,
}: ModelSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const currentModel = MODELS.find((model) => model.id === selectedModel);
  const currentProvider = PROVIDERS.find(
    (provider) => provider.id === currentModel?.icon
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between rounded-full"
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
              {MODELS.map((model) => {
                const provider = PROVIDERS.find(
                  (provider) => provider.id === model.provider
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
                    {/* <div className="flex items-center gap-2">
                    {model.features?.map((feature) => {
                      if (feature.id === "tool-use" && feature.enabled) {
                        return (
                          <Badge
                            key={feature.id}
                            variant="outline"
                            className="text-[8px] font-normal"
                          >
                            Tools
                          </Badge>
                        );
                      }
                      return null;
                    })}
                    <Check
                      className={cn(
                        "ml-auto",
                        currentModel?.id === model.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </div> */}
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
