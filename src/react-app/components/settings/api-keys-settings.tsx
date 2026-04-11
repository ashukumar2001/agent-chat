import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDERS } from "./constants";
import { trpc } from "@/lib/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import useUserPreferences from "@/hooks/useUserPreferences";
import { usePlanInfo } from "@/hooks/use-usage";
import { useModal } from "@/hooks/use-modal";

export const ApiKeysSettings: React.FC = () => {
  const { planInfo, isLoading: isPlanLoading } = usePlanInfo();
  const { openModal } = useModal();
  const isPro = planInfo?.plan?.id === "pro";
  const [selectedProvider, setSelectedProvider] = useState<string>(
    PROVIDERS[0].id
  );
  const [currentKeyInput, setCurrentKeyInput] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();
  const { userApiKeysStatus } = useUserPreferences();
  const { mutate: setUserApiKey } = useMutation(
    trpc.userSettings.setUserApiKey.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.userSettings.getUserApiKeysStatus.queryKey(),
        });
        toast.success("API key saved");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save API key");
        setCurrentKeyInput("");
      },
    })
  );
  const { mutate: deleteUserApiKey, isPending: isDeleting } = useMutation(
    trpc.userSettings.deleteUserApiKey.mutationOptions({
      onSuccess: () => {
        toast.success("API key deleted");
        queryClient.invalidateQueries({
          queryKey: trpc.userSettings.getUserApiKeysStatus.queryKey(),
        });
      },
      onError: () => {
        toast.error("Failed to delete API key");
      },
    })
  );

  // Update input field when provider selection changes (defer to avoid sync setState in effect)
  useEffect(() => {
    const defaultKey = PROVIDERS.find(
      (p) => p.id === selectedProvider
    )?.defaultKey;
    const id = requestAnimationFrame(() => {
      setCurrentKeyInput(userApiKeysStatus[selectedProvider] ? defaultKey! : "");
      setHasChanges(false);
    });
    return () => cancelAnimationFrame(id);
  }, [selectedProvider, userApiKeysStatus]);

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
  };

  const handleKeyInputChange = (value: string) => {
    setCurrentKeyInput(value);
    setHasChanges(true);
  };

  const handleSaveApiKey = () => {
    if (currentKeyInput && currentKeyInput.trim()) {
      setUserApiKey({
        key: currentKeyInput.trim(),
        provider: selectedProvider,
      });
    } else {
      deleteUserApiKey({ provider: selectedProvider });
    }
    setHasChanges(false);
  };

  const handleDeleteKey = () => {
    setCurrentKeyInput("");
    setHasChanges(false);
    deleteUserApiKey({ provider: selectedProvider });
  };

  const selectedProviderData = PROVIDERS.find((p) => p.id === selectedProvider);

  // Show loading state while checking plan
  if (isPlanLoading) {
    return (
      <div className="space-y-6 py-4">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show upgrade prompt for free users
  if (!isPro) {
    return (
      <div className="space-y-6 py-4">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Bring your own API keys to use with different AI providers.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/30">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-orange-500" />
          </div>
          <h4 className="text-lg font-semibold mb-2">Pro Feature</h4>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            BYOK (Bring Your Own Key) is available exclusively for Pro users.
            Upgrade to Pro to use your own API keys for unlimited usage with any
            provider.
          </p>
          <Button
            onClick={() => openModal("pricing")}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          Bring your own API keys to use with different AI providers. Your keys
          are stored securely with end to end encryption.
        </p>
      </div>

      {/* Provider Cards */}
      <div>
        <h4 className="text-sm font-medium mb-3">Select Provider</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-3">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const hasKey = userApiKeysStatus[provider.id];
            const isSelected = selectedProvider === provider.id;

            return (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider.id)}
                className={cn(
                  "relative p-2 sm:p-3 border rounded-lg flex flex-col items-center gap-1.5 sm:gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                  isSelected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                  {provider.name}
                </span>
                {hasKey && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Provider Details */}
      {selectedProviderData && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <selectedProviderData.icon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <h4 className="font-medium text-sm sm:text-base">
                  {selectedProviderData.name}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {userApiKeysStatus[selectedProvider]
                    ? "Key configured"
                    : "No key configured"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(selectedProviderData.getKeyUrl, "_blank")
              }
              className="text-xs w-full sm:w-auto"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Get Key
            </Button>
          </div>

          {/* API Key Input */}
          <div className="space-y-3">
            <div className="relative">
              <Input
                type="password"
                placeholder={selectedProviderData.placeholder}
                value={currentKeyInput}
                onChange={(e) => handleKeyInputChange(e.target.value)}
                className="pr-12"
              />
            </div>

            {/* Save Button */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {userApiKeysStatus[selectedProvider] && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteKey}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
                  aria-label="Delete API key"
                >
                  Delete Key
                </Button>
              )}
              <Button
                onClick={handleSaveApiKey}
                disabled={!hasChanges}
                className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 w-full sm:w-auto"
              >
                Save Key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
