// Define available avatars
export const AVATARS = [
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
  
  export function getAvatarEmoji(avatarId: string | null): string {
    if (!avatarId) return "👤" // Default avatar
  
    const avatar = AVATARS.find((a) => a.id === avatarId)
    return avatar ? avatar.emoji : "👤"
  }
  
  