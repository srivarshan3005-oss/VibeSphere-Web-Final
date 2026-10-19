package com.vibesphere.api.user;

/** What other people may see about a user: never the e-mail address. */
public record PublicUserDto(Long id, String username, String displayName, String bio, String avatarUrl) {
    public static PublicUserDto from(AppUser u) {
        return new PublicUserDto(u.getId(), u.getUsername(), u.getDisplayName(), u.getBio(), u.getAvatarUrl());
    }
}
