"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Check } from "lucide-react"

// Define available avatars
const AVATARS = [
  { id: "dumbbell", emoji: "💪", label: "Dumbbell" },
  { id: "runner", emoji: "🏃", label: "Runner" },
  { id: "cyclist", emoji: "🚴", label: "Cyclist" },
  { id: "swimmer", emoji: "🏊", label: "Swimmer" },
  { id: "basketball", emoji: "🏀", label: "Basketball" },
  { id: "football", emoji: "⚽", label: "Football" },
  { id: "tennis", emoji: "🎾", label: "Tennis" },
  { id: "yoga", emoji: "🧘", label: "Yoga" },
  { id: "mountain", emoji: "🏔️", label: "Hiking" },
  { id: "weightlifter", emoji: "🏋️", label: "Weightlifter" },
  { id: "boxing", emoji: "🥊", label: "Boxing" },
  { id: "medal", emoji: "🏅", label: "Medal" },
]

interface AvatarSelectorProps {
  userId: string
  currentAvatar?: string
  onSelect: (avatarId: string) => void
}

export default function AvatarSelector({ userId, currentAvatar, onSelect }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || "dumbbell")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (currentAvatar) {
      setSelectedAvatar(currentAvatar)
    }
  }, [currentAvatar])

  const handleSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId)
  }

  const saveSelection = async () => {
    try {
      setSaving(true)

      // Update the profile with the selected avatar
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_id: selectedAvatar,
          // Clear any existing avatar_url to avoid confusion
          avatar_url: null,
        })
        .eq("id", userId)

      if (error) {
        throw error
      }

      onSelect(selectedAvatar)

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
      console.error("Error updating avatar:", error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => handleSelect(avatar.id)}
            className={`relative h-16 w-16 rounded-md flex items-center justify-center text-3xl ${
              selectedAvatar === avatar.id
                ? "bg-primary/20 border-2 border-primary"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            aria-label={`Select ${avatar.label} avatar`}
          >
            {avatar.emoji}
            {selectedAvatar === avatar.id && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                <Check className="h-3 w-3" />
              </div>
            )}
          </button>
        ))}
      </div>

      <Button onClick={saveSelection} disabled={saving || selectedAvatar === currentAvatar} className="w-full">
        {saving ? "Saving..." : "Save Selection"}
      </Button>
    </div>
  )
}

