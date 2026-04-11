import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ActivitySparkIcon,
  LinkSquare02Icon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { PROVIDERS } from "./constants";
import { trpc } from "@/lib/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import useUserPreferences from "@/hooks/useUserPreferences";
import { usePlanInfo } from "@/hooks/use-usage";
import { useModal } from "@/hooks/use-modal";

const API_KEY_INPUT_ID = "settings-api-key";

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

  const handleProviderValueChange = useCallback((values: string[]) => {
    const next = values[0];
    if (next) {
      setSelectedProvider(next);
    }
  }, []);

  const handleKeyInputChange = useCallback((value: string) => {
    setCurrentKeyInput(value);
    setHasChanges(true);
  }, []);

  const handleSaveApiKey = useCallback(() => {
    if (currentKeyInput && currentKeyInput.trim()) {
      setUserApiKey({
        key: currentKeyInput.trim(),
        provider: selectedProvider,
      });
    } else {
      deleteUserApiKey({ provider: selectedProvider });
    }
    setHasChanges(false);
  }, [
    currentKeyInput,
    deleteUserApiKey,
    selectedProvider,
    setUserApiKey,
  ]);

  const handleDeleteKey = useCallback(() => {
    setCurrentKeyInput("");
    setHasChanges(false);
    deleteUserApiKey({ provider: selectedProvider });
  }, [deleteUserApiKey, selectedProvider]);

  const selectedProviderData = PROVIDERS.find((p) => p.id === selectedProvider);

  if (isPlanLoading) {
    return (
      <div className="flex flex-col gap-6 py-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-32 w-full rounded-4xl" />
        <Skeleton className="h-48 w-full rounded-4xl" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="flex flex-col gap-6 py-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-lg font-medium">API keys</h3>
          <p className="text-sm text-muted-foreground">
            Bring your own API keys to use with different AI providers.
          </p>
        </div>

        <Alert className="border-dashed">
          <HugeiconsIcon
            icon={SquareLock02Icon}
            strokeWidth={2}
            className="size-6"
          />
          <AlertTitle>Pro feature</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>
              BYOK (Bring Your Own Key) is available for Pro. Upgrade to connect
              your own keys for unlimited usage with any provider.
            </span>
            <Button
              type="button"
              onClick={() => openModal("pricing")}
              className="w-fit"
            >
              <HugeiconsIcon
                icon={ActivitySparkIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Upgrade to Pro
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-lg font-medium">API keys</h3>
        <p className="text-sm text-muted-foreground">
          Bring your own API keys for different AI providers. Keys are stored
          with end-to-end encryption.
        </p>
      </div>

      <FieldSet className="min-w-0 border-0 p-0">
        <FieldLegend variant="label" className="mb-3 px-0">
          Provider
        </FieldLegend>
        <ToggleGroup
          variant="outline"
          spacing={0}
          value={[selectedProvider]}
          onValueChange={handleProviderValueChange}
          className="flex w-full flex-wrap gap-2"
        >
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const hasKey = userApiKeysStatus[provider.id];
            return (
              <ToggleGroupItem
                key={provider.id}
                value={provider.id}
                aria-label={`${provider.name}${hasKey ? ", key on file" : ""}`}
                className={cn(
                  "relative flex h-auto min-h-24 w-[calc(50%-0.25rem)] flex-col gap-2 py-3 sm:w-[calc(33.333%-0.34rem)] md:w-[calc(25%-0.375rem)] lg:w-[calc(20%-0.4rem)]",
                  "data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:ring-2 data-[state=on]:ring-primary/25"
                )}
              >
                {hasKey && (
                  <span
                    className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary ring-2 ring-background"
                    aria-hidden
                  />
                )}
                <div className="flex size-10 items-center justify-center">
                  <Icon aria-hidden className="size-10" />
                </div>
                <span className="text-center text-[10px] font-medium leading-tight sm:text-xs">
                  {provider.name}
                </span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </FieldSet>

      {selectedProviderData && (
        <ProviderKeyCard
          selectedProviderData={selectedProviderData}
          selectedProvider={selectedProvider}
          userApiKeysStatus={userApiKeysStatus}
          currentKeyInput={currentKeyInput}
          hasChanges={hasChanges}
          isDeleting={isDeleting}
          onKeyInputChange={handleKeyInputChange}
          onSave={handleSaveApiKey}
          onDelete={handleDeleteKey}
        />
      )}
    </div>
  );
};

type ProviderKeyCardProps = {
  selectedProviderData: (typeof PROVIDERS)[number];
  selectedProvider: string;
  userApiKeysStatus: Record<string, boolean | undefined>;
  currentKeyInput: string;
  hasChanges: boolean;
  isDeleting: boolean;
  onKeyInputChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

const ProviderKeyCard = React.memo(function ProviderKeyCard({
  selectedProviderData,
  selectedProvider,
  userApiKeysStatus,
  currentKeyInput,
  hasChanges,
  isDeleting,
  onKeyInputChange,
  onSave,
  onDelete,
}: ProviderKeyCardProps) {
  const ProviderIcon = selectedProviderData.icon;

  return (
    <Card size="sm" className="shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center">
              <ProviderIcon aria-hidden className="size-12" />
            </div>
            <div className="min-w-0 flex flex-col gap-1">
              <CardTitle>{selectedProviderData.name}</CardTitle>
              <CardDescription>
                {userApiKeysStatus[selectedProvider]
                  ? "Key configured for this provider."
                  : "No key on file yet."}
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            onClick={() =>
              window.open(selectedProviderData.getKeyUrl, "_blank")
            }
          >
            <HugeiconsIcon
              icon={LinkSquare02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Get key
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={API_KEY_INPUT_ID}>API key</FieldLabel>
            <Input
              id={API_KEY_INPUT_ID}
              type="password"
              autoComplete="off"
              placeholder={selectedProviderData.placeholder}
              value={currentKeyInput}
              onChange={(e) => onKeyInputChange(e.target.value)}
            />
            <FieldDescription>
              Paste your secret key. It is encrypted before storage.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        {userApiKeysStatus[selectedProvider] && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="w-full gap-2 sm:w-auto"
            aria-label="Delete API key"
          >
            {isDeleting ? (
              <>
                <Spinner className="size-4" />
                Deleting…
              </>
            ) : (
              "Delete key"
            )}
          </Button>
        )}
        <Button
          type="button"
          onClick={onSave}
          disabled={!hasChanges}
          className="w-full sm:ml-auto sm:w-auto"
        >
          Save key
        </Button>
      </CardFooter>
    </Card>
  );
});
