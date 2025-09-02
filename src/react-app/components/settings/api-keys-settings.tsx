import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDERS } from "./constants";
import { trpc } from "@/lib/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import useUserPreferences from "@/hooks/useUserPreferences";

export const ApiKeysSettings: React.FC = () => {
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

  // Update input field when provider selection changes
  useEffect(() => {
    const defaultKey = PROVIDERS.find(
      (p) => p.id === selectedProvider
    )?.defaultKey;
    setCurrentKeyInput(userApiKeysStatus[selectedProvider] ? defaultKey! : "");
    setHasChanges(false);
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
  return (
    <div className="space-y-6">
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
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const hasKey = userApiKeysStatus[provider.id];
            const isSelected = selectedProvider === provider.id;

            return (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider.id)}
                className={cn(
                  "relative p-3 border rounded-lg flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                  isSelected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Icon className="w-8 h-8" />
                </div>
                <span className="text-xs font-medium text-center">
                  {provider.name}
                </span>
                {hasKey && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Provider Details */}
      {selectedProviderData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <selectedProviderData.icon className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-medium">{selectedProviderData.name}</h4>
                <p className="text-sm text-muted-foreground">
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
              className="text-xs"
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
            <div className="flex items-center justify-between">
              {userApiKeysStatus[selectedProvider] && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteKey}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  aria-label="Delete API key"
                >
                  Delete Key
                </Button>
              )}
              <Button
                onClick={handleSaveApiKey}
                disabled={!hasChanges}
                className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
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
