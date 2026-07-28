type UserAvatarProps = {
  url?: string
  storageId?: string
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

  const avatarUrl = url ?? storageId

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl} />
      <AvatarFallback>
        {name?.charAt(0) ?? email?.charAt(0) ?? "U"}
      </AvatarFallback>
    </Avatar>
  )
}