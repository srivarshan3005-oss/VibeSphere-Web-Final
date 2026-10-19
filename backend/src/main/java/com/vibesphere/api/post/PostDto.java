package com.vibesphere.api.post;

import java.time.Instant;

public record PostDto(Long id, Long userId, String username, String displayName, String avatarUrl, String caption,
                      String mediaUrl, String mediaType, String visibility, Instant createdAt,
                      long likesCount, long commentsCount, boolean likedByMe) {}
