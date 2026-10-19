package com.vibesphere.api.user;

import java.time.Instant;

public record ProfileDto(Long id, String username, String displayName, String bio, String avatarUrl, Instant createdAt,
                         long postsCount, long followersCount, long followingCount, boolean followedByMe, boolean isMe) {}
