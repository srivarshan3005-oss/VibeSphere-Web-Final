package com.vibesphere.api.comment;

import com.vibesphere.api.post.Post;
import com.vibesphere.api.post.PostAccess;
import com.vibesphere.api.post.PostRepository;
import com.vibesphere.api.user.AppUser;
import com.vibesphere.api.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Comments with one level of replies (parentId). */
@RestController
@RequestMapping("/posts/{postId}/comments")
public class CommentController {
    public record CreateComment(@NotBlank @Size(max = 1000) String body, Long parentId) {}
    public record CommentDto(Long id, Long postId, Long parentId, Long userId, String username, String displayName,
                             String avatarUrl, String body, Instant createdAt) {}

    private final CommentRepository comments;
    private final PostRepository posts;
    private final UserRepository users;
    private final PostAccess access;

    public CommentController(CommentRepository comments, PostRepository posts, UserRepository users, PostAccess access) {
        this.comments = comments;
        this.posts = posts;
        this.users = users;
        this.access = access;
    }

    private AppUser me(Authentication a) {
        return users.findByEmailIgnoreCase(a.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
    }

    private Post post(Long id, AppUser viewer) {
        Post p = posts.findWithUserById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        access.requireView(p, viewer);
        return p;
    }

    private CommentDto dto(Comment c) {
        AppUser u = c.getUser();
        return new CommentDto(c.getId(), c.getPostId(), c.getParentId(), u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl(), c.getBody(), c.getCreatedAt());
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<CommentDto> list(Authentication a, @PathVariable Long postId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        post(postId, me(a));
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.ASC, "createdAt").and(Sort.by(Sort.Direction.ASC, "id")));
        return comments.findByPostId(postId, pageable).stream().map(this::dto).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CommentDto create(Authentication a, @PathVariable Long postId, @Valid @RequestBody CreateComment r) {
        AppUser u = me(a);
        post(postId, u);
        Long parentId = r.parentId();
        if (parentId != null) {
            Comment parent = comments.findById(parentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment to reply to was not found"));
            if (!parent.getPostId().equals(postId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply must belong to the same post");
            if (parent.getParentId() != null) parentId = parent.getParentId(); // flatten to one level
        }
        return dto(comments.save(new Comment(postId, parentId, u, r.body().trim())));
    }

    @DeleteMapping("/{commentId}")
    @Transactional
    public Map<String, Object> delete(Authentication a, @PathVariable Long postId, @PathVariable Long commentId) {
        AppUser u = me(a);
        Post p = post(postId, u);
        Comment c = comments.findWithUserById(commentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        if (!c.getPostId().equals(postId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        boolean author = c.getUser().getId().equals(u.getId());
        boolean postOwner = p.getUser().getId().equals(u.getId());
        if (!author && !postOwner) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this comment");
        comments.deleteByParentId(commentId);
        comments.delete(c);
        return Map.of("deleted", true, "id", commentId);
    }
}
