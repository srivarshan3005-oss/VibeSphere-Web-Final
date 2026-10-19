package com.vibesphere.api.post;

import com.vibesphere.api.user.AppUser;
import com.vibesphere.api.user.FollowRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PostAccessTest {
    private final FollowRepository follows = mock(FollowRepository.class);
    private final PostAccess access = new PostAccess(follows);

    private static AppUser user(long id) { AppUser u = mock(AppUser.class); when(u.getId()).thenReturn(id); return u; }
    private static Post post(String visibility, AppUser author) {
        Post p = mock(Post.class);
        when(p.getVisibility()).thenReturn(visibility);
        when(p.getUser()).thenReturn(author);
        return p;
    }

    @Test void publicPostsAreVisibleToEverySignedInUser() { assertTrue(access.canView(post("PUBLIC", user(1)), user(2))); }
    @Test void authorSeesOwnFollowersOnlyPost() { AppUser a = user(1); assertTrue(access.canView(post("FOLLOWERS", a), a)); }

    @Test void followerSeesFollowersOnlyPost() {
        when(follows.existsByFollowerIdAndFollowedId(2L, 1L)).thenReturn(true);
        assertTrue(access.canView(post("FOLLOWERS", user(1)), user(2)));
    }

    @Test void strangerCannotSeeFollowersOnlyPostAndGetsNotFound() {
        when(follows.existsByFollowerIdAndFollowedId(3L, 1L)).thenReturn(false);
        Post p = post("FOLLOWERS", user(1));
        assertFalse(access.canView(p, user(3)));
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> access.requireView(p, user(3)));
        assertEquals(404, e.getStatusCode().value());
    }

    @Test void anonymousViewerCannotSeeNonPublicPost() { assertFalse(access.canView(post("FOLLOWERS", user(1)), null)); }
}
