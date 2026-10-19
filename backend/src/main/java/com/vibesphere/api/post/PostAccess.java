package com.vibesphere.api.post;

import com.vibesphere.api.user.AppUser;
import com.vibesphere.api.user.FollowRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Visibility rule for a single post: PUBLIC posts are visible to every signed-in user; any other visibility
 * (FOLLOWERS) only to the author and to people who follow the author. Used before liking or commenting so a
 * guessed post id cannot be used to touch or read a post that the feed hides.
 */
@Component
public class PostAccess {
    private final FollowRepository follows;

    public PostAccess(FollowRepository follows) {
        this.follows = follows;
    }

    public boolean canView(Post post, AppUser viewer) {
        if ("PUBLIC".equals(post.getVisibility())) return true;
        if (viewer == null) return false;
        Long authorId = post.getUser().getId();
        return authorId.equals(viewer.getId()) || follows.existsByFollowerIdAndFollowedId(viewer.getId(), authorId);
    }

    /** Answers 404 (not 403) so the existence of hidden posts is not revealed. */
    public void requireView(Post post, AppUser viewer) {
        if (!canView(post, viewer)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
    }
}
