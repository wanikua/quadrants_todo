"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserMinus, Crown, Shield, User, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Member {
  user_id: string
  name: string
  email: string
  role: "owner" | "admin" | "member"
  joined_at: string
}

interface ManageMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentUserRole: "owner" | "admin" | "member"
  currentUserId?: string
  onMemberRemoved?: () => void
}

export function ManageMembersDialog({
  open,
  onOpenChange,
  projectId,
  currentUserRole,
  currentUserId,
  onMemberRemoved,
}: ManageMembersDialogProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  useEffect(() => {
    if (open) {
      fetchMembers()
    }
  }, [open, projectId])

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      const data = await response.json()

      if (data.success) {
        setMembers(data.members)
      } else {
        toast.error(data.error || "Failed to load members")
      }
    } catch (error) {
      toast.error("Failed to load members")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (member: Member) => {
    setMemberToRemove(member)
    setShowRemoveDialog(true)
  }

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return

    setRemovingUserId(memberToRemove.user_id)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberToRemove.user_id}`,
        { method: "DELETE" }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to remove member")
        return
      }

      toast.success(`${memberToRemove.name} removed from project`)
      setMembers(members.filter((m) => m.user_id !== memberToRemove.user_id))
      onMemberRemoved?.()
    } catch (error) {
      toast.error("Failed to remove member")
      console.error(error)
    } finally {
      setRemovingUserId(null)
      setShowRemoveDialog(false)
      setMemberToRemove(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4" />
      case "admin":
        return <Shield className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const canRemoveMember = (member: Member) => {
    // Cannot remove yourself
    if (currentUserId && member.user_id === currentUserId) return false

    // Owner cannot be removed
    if (member.role === "owner") return false

    // Only owner can remove admins
    if (member.role === "admin" && currentUserRole !== "owner") return false

    // Admins and owners can remove members
    return currentUserRole === "owner" || currentUserRole === "admin"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              View and manage project members. Removing a member will unassign them from all tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No members found
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{member.name}</p>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getRoleBadgeColor(member.role)}`}
                          >
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {canRemoveMember(member) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member)}
                        disabled={removingUserId === member.user_id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {removingUserId === member.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove && (
                <>
                  Are you sure you want to remove <strong>{memberToRemove.name}</strong> from this project?
                  <br />
                  <br />
                  This will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Remove them from all task assignments</li>
                    <li>Delete their player profiles in this project</li>
                    <li>Revoke their access to this project</li>
                  </ul>
                  <br />
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
