package com.vibesphere.api.user;
import java.time.Instant;
public record UserDto(Long id,String username,String displayName,String email,String bio,String avatarUrl,boolean isPrivate,Instant createdAt) {
 public static UserDto from(AppUser u){return new UserDto(u.getId(),u.getUsername(),u.getDisplayName(),u.getEmail(),u.getBio(),u.getAvatarUrl(),u.isPrivate(),u.getCreatedAt());}
}
