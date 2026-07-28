
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
type UserAvatarProps = {
  url?: string
  storageId?: string | null
  name?: string
  email?: string
  className?: string
}

export function UserAvatar({
  url,
  storageId,
  name,
  email,
  className,
}: UserAvatarProps) {
  const avatarUrl = url ?? storageId ?? undefined

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl} />
      <AvatarFallback>
        {name?.[0] || email?.[0] || "U"}
      </AvatarFallback>
    </Avatar>
  )
}