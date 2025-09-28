import { useState } from "react";
import { Bell, Check, X, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    invitations,
    isLoading,
    unreadCount,
    acceptInvitation,
    declineInvitation,
    isAccepting,
    isDeclining,
  } = useNotifications();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "clinical":
        return "Clinical Staff";
      case "patient":
        return "Patient";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "clinical":
        return "bg-blue-100 text-blue-800";
      case "patient":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative gap-2 text-gray-600 hover:text-gray-900"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-b p-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <p className="text-sm text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} pending invitation${unreadCount > 1 ? "s" : ""}`
              : "No new notifications"}
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : !invitations || invitations.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No notifications
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You'll see clinic invitations here when you receive them.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">
                            Clinic Invitation
                          </h4>
                          <Badge className={getRoleColor(invitation.role)}>
                            {getRoleLabel(invitation.role)}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatDistanceToNow(
                            new Date(invitation.created_at),
                          )}{" "}
                          ago
                        </div>
                      </div>

                      {/* Clinic Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">
                              {invitation.clinic?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {invitation.clinic?.type?.replace("_", " ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {invitation.clinic?.city},{" "}
                            {invitation.clinic?.state}
                          </p>
                        </div>
                      </div>

                      {/* Expiry */}
                      <p className="text-xs text-orange-600">
                        Expires{" "}
                        {formatDistanceToNow(new Date(invitation.expires_at))}{" "}
                        from now
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptInvitation(invitation.id)}
                          disabled={isAccepting || isDeclining}
                          className="flex-1 gap-1"
                        >
                          <Check className="h-3 w-3" />
                          {isAccepting ? "Accepting..." : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declineInvitation(invitation.id)}
                          disabled={isAccepting || isDeclining}
                          className="flex-1 gap-1"
                        >
                          <X className="h-3 w-3" />
                          {isDeclining ? "Declining..." : "Decline"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
