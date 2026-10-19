package com.vibesphere.api.post;

import com.vibesphere.api.comment.CommentRepository;
import com.vibesphere.api.user.AppUser;
import com.vibesphere.api.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/posts")
public class PostController {
    /** Remote http(s) URL or a file this server stored through POST /uploads. */
    public static final String MEDIA_PATTERN = "^(https?://\\S+|/api/uploads/[A-Za-z0-9._-]+)$";

    public record CreatePost(@Size(max = 2200) String caption,
                             @NotBlank @Size(max = 2048) @Pattern(regexp = MEDIA_PATTERN, message = "must be an http(s) URL or an uploaded file") String mediaUrl,
                             @Pattern(regexp = "IMAGE|VIDEO") String mediaType,
                             @Pattern(regexp = "PUBLIC|FOLLOWERS") String visibility) {}

    public record UpdatePost(@NotNull @Size(max = 2200) String caption) {}

    private final PostRepository posts;
    private final LikeRepository likes;
    private final CommentRepository comments;
    private final UserRepository users;
    private final PostService postService;
    private final PostAccess access;

    public PostController(PostRepository posts, LikeRepository likes, CommentRepository comments, UserRepository users, PostService postService, PostAccess access) {
        this.posts = posts;
        this.likes = likes;
        this.comments = comments;
        this.users = users;
        this.postService = postService;
        this.access = access;
    }

    private AppUser optionalMe(Authentication a) {
        if (a == null || !a.isAuthenticated() || "anonymousUser".equals(a.getName())) return null;
        return users.findByEmailIgnoreCase(a.getName()).orElse(null);
    }

    private AppUser requireMe(Authentication a) {
        AppUser u = optionalMe(a);
        if (u == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in");
        return u;
    }

    public static Pageable page(int page, int size) {
        int s = Math.min(Math.max(size, 1), 50);
        return PageRequest.of(Math.max(page, 0), s, Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
    }

    /** Public feed. Defaults (page 0, size 50) keep the original behaviour; the mobile app passes page/size. */
    @GetMapping
    public List<PostDto> feed(Authentication a, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return postService.toDtos(posts.findByVisibility("PUBLIC", page(page, size)), optionalMe(a));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostDto create(Authentication a, @Valid @RequestBody CreatePost r) {
        AppUser u = requireMe(a);
        Post p = posts.save(new Post(u, r.caption() == null ? "" : r.caption().trim(), r.mediaUrl(),
                r.mediaType() == null ? "IMAGE" : r.mediaType(), r.visibility() == null ? "PUBLIC" : r.visibility()));
        return postService.toDto(p, u);
    }

    @PatchMapping("/{id}")
    @Transactional
    public PostDto update(Authentication a, @PathVariable Long id, @Valid @RequestBody UpdatePost r) {
        AppUser u = requireMe(a);
        Post p = posts.findWithUserById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (!p.getUser().getId().equals(u.getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own posts");
        p.setCaption(r.caption().trim());
        return postService.toDto(posts.save(p), u);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, Object> delete(Authentication a, @PathVariable Long id) {
        AppUser u = requireMe(a);
        Post p = posts.findWithUserById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (!p.getUser().getId().equals(u.getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own posts");
        likes.deleteByPostId(id);
        comments.deleteByPostId(id);
        posts.delete(p);
        return Map.of("deleted", true, "id", id);
    }

    @PostMapping("/{id}/like")
    @Transactional
    public Map<String, Object> toggleLike(Authentication a, @PathVariable Long id) {
        AppUser u = requireMe(a);
        Post p = posts.findWithUserById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        access.requireView(p, u);
        var existing = likes.findByUserIdAndPostId(u.getId(), p.getId());
        boolean liked;
        if (existing.isPresent()) {
            likes.delete(existing.get());
            liked = false;
        } else {
            likes.save(new Like(u.getId(), p.getId()));
            liked = true;
        }
        likes.flush();
        return Map.of("likedByMe", liked, "likesCount", likes.countByPostId(id));
    }
}
