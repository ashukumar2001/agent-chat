import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { MODELS } from "@worker/lib/models";
import { useMemo } from "react";

const useUserPreferences = () => {
    const { data: userApiKeysStatus, isLoading: isLoadingUserApiKeysStatus } = useQuery(
        trpc.userSettings.getUserApiKeysStatus.queryOptions()
    );
    const models = useMemo(() => {
        if (userApiKeysStatus) {
            return MODELS.filter((model) => {
                return userApiKeysStatus[model.providerId];
            });
        }
        return [];
    }, [userApiKeysStatus]);
    return {
        userApiKeysStatus: userApiKeysStatus || {},
        isLoadingUserPreferences: isLoadingUserApiKeysStatus,
        models,
    };
};

export default useUserPreferences;