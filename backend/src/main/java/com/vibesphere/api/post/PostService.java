package com.vibesphere.api.post;

import com.vibesphere.api.comment.CommentRepository;
import com.vibesphere.api.user.AppUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PostService {
    private final LikeRepository likes;
    private final CommentRepository comments;

    public PostService(LikeRepository likes, CommentRepository comments) {
        this.likes = likes;
        this.comments = comments;
    }

    /** Maps a page of posts to DTOs using three batched queries instead of 2 queries per post. */
    @Transactional(readOnly = true)
    public List<PostDto> toDtos(List<Post> posts, AppUser me) {
        if (posts.isEmpty()) return List.of();
        List<Long> ids = posts.stream().map(Post::getId).toList();
        Map<Long, Long> likeCounts = new HashMap<>();
        likes.countByPostIds(ids).forEach(c -> likeCounts.put(c.getEntityId(), c.getCnt()));
        Map<Long, Long> commentCounts = new HashMap<>();
        comments.countByPostIds(ids).forEach(c -> commentCounts.put(c.getEntityId(), c.getCnt()));
        Set<Long> mine = me == null ? Set.of()
                : likes.findByUserIdAndPostIdIn(me.getId(), ids).stream().map(Like::getPostId).collect(Collectors.toSet());
        return posts.stream().map(p -> new PostDto(p.getId(), p.getUser().getId(), p.getUser().getUsername(),
                p.getUser().getDisplayName(), p.getUser().getAvatarUrl(), p.getCaption(), p.getMediaUrl(), p.getMediaType(),
                p.getVisibility(), p.getCreatedAt(), likeCounts.getOrDefault(p.getId(), 0L),
                commentCounts.getOrDefault(p.getId(), 0L), mine.contains(p.getId()))).toList();
    }

    public PostDto toDto(Post post, AppUser me) {
        return toDtos(List.of(post), me).get(0);
    }
}
