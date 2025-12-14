import { useSession } from "@/hooks/useSession";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Mail, Shield, User, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { useModal } from "@/hooks/use-modal";

export const ProfilePage = () => {
  const { user, session, isPending } = useSession();
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/" });
  };

  const formatDate = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(timestamp);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isPending) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Not signed in</h2>
          <p className="text-muted-foreground text-center mb-6">
            You need to be signed in to view your profile.
          </p>
          <Button
            onClick={() => {
              closeModal();
              openModal("login");
            }}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
        </div>

        {/* Profile Info */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="text-base sm:text-lg">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-semibold">
                  {user.name}
                </h2>
                {user.isAnonymous && (
                  <Badge variant="secondary">Anonymous</Badge>
                )}
                {user.emailVerified && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 hover:bg-green-100"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Separator />

        {/* User Information */}
        <div className="grid gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">
              Account Information
            </h3>

            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">
              Account Status
            </h3>

            <div className="flex items-center space-x-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground truncate">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground truncate">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Information */}
        {session && (
          <>
            <Separator />
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">
                Current Session
              </h3>
              <div>
                <p className="text-sm font-medium">Session Expires</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(session.expiresAt)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Account Type Info */}
        <Separator />
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Account Type
          </h3>
          {user.isAnonymous ? (
            <p className="text-sm text-muted-foreground">
              This is an anonymous account. Consider signing up with a provider
              to secure your data and access additional features.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              This is a registered account with email verification{" "}
              {user.emailVerified ? "completed" : "pending"}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
