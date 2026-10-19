package com.vibesphere.api.user;

import com.vibesphere.api.post.PostController;
import com.vibesphere.api.post.PostDto;
import com.vibesphere.api.post.PostRepository;
import com.vibesphere.api.post.PostService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {
    /** All fields optional: only the ones sent are changed. */
    public record UpdateProfile(@Size(min = 1, max = 80) String displayName,
                                @Size(max = 300) String bio,
                                @Size(max = 2048) @Pattern(regexp = "^(https?://\\S+|/api/uploads/[A-Za-z0-9._-]+)?$", message = "must be an http(s) URL or an uploaded file") String avatarUrl) {}

    private final UserRepository users;
    private final FollowRepository follows;
    private final PostRepository posts;
    private final PostService postService;

    public UserController(UserRepository users, FollowRepository follows, PostRepository posts, PostService postService) {
        this.users = users;
        this.follows = follows;
        this.posts = posts;
        this.postService = postService;
    }

    private AppUser currentUser(Authentication a) {
        return users.findByEmailIgnoreCase(a.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
    }

    @GetMapping("/me")
    public UserDto me(Authentication a) {
        return UserDto.from(currentUser(a));
    }

    @GetMapping("/search")
    public List<PublicUserDto> search(@RequestParam(defaultValue = "") String q) {
        String term = q.trim();
        if (term.length() < 2) return List.of(); // never list the whole user table
        return users.findTop20ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(term, term).stream()
                .filter(AppUser::isActive).map(PublicUserDto::from).toList();
    }

    @PutMapping("/me")
    public UserDto update(Authentication a, @Valid @RequestBody UpdateProfile b) {
        AppUser u = currentUser(a);
        if (b.displayName() != null) {
            if (b.displayName().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name cannot be empty");
            u.setDisplayName(b.displayName().trim());
        }
        if (b.bio() != null) u.setBio(b.bio().trim());
        if (b.avatarUrl() != null) u.setAvatarUrl(b.avatarUrl().isBlank() ? null : b.avatarUrl());
        return UserDto.from(users.save(u));
    }

    @PostMapping("/{id}/follow")
    @Transactional
    public Map<String, Object> toggleFollow(Authentication a, @PathVariable Long id) {
        AppUser from = currentUser(a);
        AppUser to = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (from.getId().equals(to.getId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot follow yourself");
        boolean now = follows.findByFollowerIdAndFollowedId(from.getId(), to.getId()).map(f -> {
            follows.delete(f);
            return false;
        }).orElseGet(() -> {
            follows.save(new Follow(from.getId(), to.getId()));
            return true;
        });
        return Map.of("following", now, "userId", id, "followersCount", follows.countByFollowedId(id));
    }

    /** Public profile with real counts; the e-mail address is intentionally not included. */
    @GetMapping("/{id}")
    public ProfileDto profile(Authentication a, @PathVariable Long id) {
        AppUser me = currentUser(a);
        AppUser u = users.findById(id).filter(AppUser::isActive).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return new ProfileDto(u.getId(), u.getUsername(), u.getDisplayName(), u.getBio(), u.getAvatarUrl(), u.getCreatedAt(),
                posts.countByUser_Id(id), follows.countByFollowedId(id), follows.countByFollowerId(id),
                follows.existsByFollowerIdAndFollowedId(me.getId(), id), me.getId().equals(id));
    }

    @GetMapping("/{id}/posts")
    @Transactional(readOnly = true)
    public List<PostDto> userPosts(Authentication a, @PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        AppUser me = currentUser(a);
        if (!users.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        var pageable = PostController.page(page, size);
        // Owners see everything they posted; everyone else sees PUBLIC posts only.
        var list = me.getId().equals(id) ? posts.findByUser_Id(id, pageable) : posts.findByUser_IdAndVisibility(id, "PUBLIC", pageable);
        return postService.toDtos(list, me);
    }
}
