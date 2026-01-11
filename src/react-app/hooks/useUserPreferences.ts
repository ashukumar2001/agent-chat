import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { MODELS } from "@worker/lib/models";
import { useMemo } from "react";
import { useSession } from "./useSession";
import { usePlanInfo } from "./use-usage";

const useUserPreferences = () => {
  const { user } = useSession();
  const { data: userApiKeysStatusData, isLoading: isLoadingUserApiKeysStatus } =
    useQuery(
      trpc.userSettings.getUserApiKeysStatus.queryOptions(undefined, {
        enabled: !!user,
      })
    );
  const { planInfo, isLoading: isLoadingPlanInfo } = usePlanInfo();

  const userApiKeysStatus = useMemo(
    () => (user ? userApiKeysStatusData : {}),
    [userApiKeysStatusData, user]
  );

  const models = useMemo(() => {
    if (!user) return [];

    const allowedModels = planInfo?.plan?.limits?.allowedModels;
    const hasUnlimitedAccess = allowedModels === null; // Pro plan - all models allowed

    return MODELS.filter((model) => {
      // If user has their own API key for this provider, show all models from that provider
      if (userApiKeysStatus?.[model.providerId]) {
        return true;
      }

      // If user has unlimited access (pro plan), show all models
      if (hasUnlimitedAccess) {
        return true;
      }

      // For free tier users without their own API key, only show allowed models
      if (allowedModels && allowedModels.includes(model.id)) {
        return true;
      }

      return false;
    });
  }, [userApiKeysStatus, planInfo, user]);

  return {
    userApiKeysStatus: userApiKeysStatus || {},
    isLoadingUserPreferences: isLoadingUserApiKeysStatus || isLoadingPlanInfo,
    models,
    planInfo,
  };
};

export default useUserPreferences;
