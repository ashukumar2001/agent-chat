import * as React from "react";
import { ChevronsUpDown, LogIn, Key } from "lucide-react";

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
import { useSession } from "@/hooks/useSession";
import { useModal } from "@/hooks/use-modal";
import { Badge } from "@/components/ui/badge";

type ModelSwitcherProps = {
  selectedModel: string;
  handleModelChange: (model: string) => void;
};

export function ModelSwitcher({
  selectedModel,
  handleModelChange,
}: ModelSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const { isLoadingUserPreferences, models, userApiKeysStatus, planInfo } =
    useUserPreferences();
  const { user, isPending: isSessionPending } = useSession();
  const { openModal } = useModal();
  const currentModel = models.find((model) => model.id === selectedModel);
  const currentProvider = PROVIDERS.find(
    (provider) => provider.id === currentModel?.providerId
  );

  const isLoggedIn = !!user;
  const hasModels = models.length > 0;

  // Get free tier models from plan info
  const freeTierModels = planInfo?.freeTierModels || [];

  // Group models by provider for better organization
  const groupedModels = React.useMemo(() => {
    const groups: Record<string, typeof models> = {};
    models.forEach((model) => {
      const providerId = model.providerId;
      if (!groups[providerId]) {
        groups[providerId] = [];
      }
      groups[providerId].push(model);
    });
    return groups;
  }, [models]);

  // Check if a model is available via user's own API key
  const isUserApiKeyModel = (providerId: string) => {
    return userApiKeysStatus?.[providerId] === true;
  };

  // Check if a model is in the free tier
  const isFreeModel = (modelId: string) => {
    return freeTierModels.includes(modelId);
  };

  const renderEmptyState = () => {
    if (isSessionPending || isLoadingUserPreferences) {
      return <CommandEmpty>Loading...</CommandEmpty>;
    }

    if (!isLoggedIn) {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <LogIn className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">Sign in to get started</p>
          <p className="text-xs text-muted-foreground mb-4">
            Login to add your API keys and access AI models
          </p>
          <Button
            size="sm"
            onClick={() => {
              setOpen(false);
              openModal("login");
            }}
          >
            Sign In
          </Button>
        </div>
      );
    }

    if (!hasModels) {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <Key className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">No models available</p>
          <p className="text-xs text-muted-foreground mb-4">
            Add your API keys in settings to unlock AI models
          </p>
          <Button
            size="sm"
            onClick={() => {
              setOpen(false);
              openModal("settings", "api-keys");
            }}
          >
            Add API Keys
          </Button>
        </div>
      );
    }

    return <CommandEmpty>No model found.</CommandEmpty>;
  };

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
            {!hasModels || !isLoggedIn ? (
              renderEmptyState()
            ) : (
              <>
                <CommandEmpty>No model found.</CommandEmpty>
                {Object.entries(groupedModels).map(
                  ([providerId, providerModels]) => {
                    const provider = PROVIDERS.find((p) => p.id === providerId);
                    const hasOwnKey = isUserApiKeyModel(providerId);

                    return (
                      <CommandGroup
                        key={providerId}
                        heading={
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              {provider?.icon && (
                                <provider.icon className="w-3 h-3" />
                              )}
                              <span>{provider?.name || providerId}</span>
                            </div>
                            {hasOwnKey && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 font-normal"
                              >
                                Your Key
                              </Badge>
                            )}
                          </div>
                        }
                      >
                        {providerModels.map((model) => (
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
                              {provider?.icon && (
                                <provider.icon className="w-4 h-4" />
                              )}
                              {model.name}
                            </div>
                            {isFreeModel(model.id) && (
                              <Badge
                                variant="default"
                                className="text-[10px] px-1.5 py-0 h-4 font-normal bg-blue-400"
                              >
                                Free
                              </Badge>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    );
                  }
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
