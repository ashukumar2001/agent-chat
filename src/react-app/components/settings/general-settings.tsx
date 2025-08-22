import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface GeneralSettingsProps {
  onOpenChange: (open: boolean) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  onOpenChange,
}) => {
  const { data: userSessionData } = authClient.useSession();

  const handleSignOut = () => {
    authClient.signOut();
    onOpenChange(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-4">Profile</h3>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userSessionData?.user?.image || ""} />
            <AvatarFallback className="bg-orange-500 text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">
              {userSessionData?.user?.name || "Technical Hacks"}
            </p>
            <p className="text-sm text-muted-foreground">
              {userSessionData?.user?.email || "helpidert111@gmail.com"}
            </p>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-4">Account</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Log out on this device
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSignOut}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};
