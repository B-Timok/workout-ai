"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import { Camera, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AvatarUploadProps {
  uid: string
  url?: string
  size?: number
  onUpload: (url: string) => void
}

export default function AvatarUpload({ uid, url: externalUrl, size = 150, onUpload }: AvatarUploadProps) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (externalUrl) {
      setAvatarUrl(externalUrl)
      setImageError(false)
    } else {
      downloadImage(uid)
    }
  }, [externalUrl, uid])

  async function downloadImage(id: string) {
    try {
      setImageError(false)
      // Check if image exists
      const { data: existingFiles, error: existingError } = await supabase.storage.from("avatars").list(`${id}`)

      if (existingError) {
        throw existingError
      }

      // If avatar exists, download it
      if (existingFiles && existingFiles.length > 0) {
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(`${id}/${existingFiles[0].name}`)

        if (publicUrlData) {
          setAvatarUrl(publicUrlData.publicUrl)
        }
      }
    } catch (error: any) {
      console.error("Error downloading image: ", error.message)
      setImageError(true)
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      setImageError(false)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${uid}/${fileName}`

      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size must be less than 2MB")
      }

      // Check file type
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        throw new Error("File must be an image (JPEG, PNG, or GIF)")
      }

      // Clear existing avatars first to maintain only one avatar per user
      const { data: existingFiles } = await supabase.storage.from("avatars").list(uid)

      if (existingFiles && existingFiles.length > 0) {
        await Promise.all(
          existingFiles.map(async (file) => {
            await supabase.storage.from("avatars").remove([`${uid}/${file.name}`])
          }),
        )
      }

      // Upload the new avatar
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Make sure we have a valid URL
      const publicUrl = data.publicUrl

      console.log("Avatar uploaded successfully, URL:", publicUrl)

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", uid)

      if (updateError) {
        console.error("Error updating profile:", updateError)
      }

      setAvatarUrl(publicUrl)
      onUpload(publicUrl)

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
      console.error("Error uploading avatar: ", error.message)
      setImageError(true)
    } finally {
      setUploading(false)
    }
  }

  // Handle image load error
  const handleImageError = () => {
    console.error("Failed to load image from URL:", avatarUrl)
    setImageError(true)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative overflow-hidden rounded-full ${avatarUrl && !imageError ? "" : "bg-secondary border-2 border-dashed border-primary/50"}`}
        style={{ width: size, height: size }}
      >
        {avatarUrl && !imageError ? (
          <>
            {/* Use a regular img tag instead of Next.js Image for Supabase storage URLs */}
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="h-full w-full object-cover" 
              onError={handleImageError}
            />
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-8 w-8 text-white" />
            </label>
          </>
        ) : (
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
          >
            <Upload className="h-8 w-8 text-primary" />
            <span className="text-xs text-center mt-2 px-2">Upload Photo</span>
          </label>
        )}
      </div>

      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        className="sr-only"
      />

      {uploading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-primary">Uploading...</span>
        </div>
      )}
    </div>
  )
}
