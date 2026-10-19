package com.vibesphere.api.comment;

import com.vibesphere.api.user.AppUser;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "comments", indexes = {
        @Index(name = "idx_comments_post_created", columnList = "post_id,created_at"),
        @Index(name = "idx_comments_parent", columnList = "parent_id")})
public class Comment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "post_id", nullable = false) private Long postId;
    @Column(name = "parent_id") private Long parentId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private AppUser user;
    @Column(nullable = false, length = 1000) private String body;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();

    protected Comment() {}
    public Comment(Long postId, Long parentId, AppUser user, String body) {
        this.postId = postId; this.parentId = parentId; this.user = user; this.body = body;
    }
    public Long getId() { return id; }
    public Long getPostId() { return postId; }
    public Long getParentId() { return parentId; }
    public AppUser getUser() { return user; }
    public String getBody() { return body; }
    public Instant getCreatedAt() { return createdAt; }
}
