package com.vibesphere.api.story;

import com.vibesphere.api.user.AppUser;
import com.vibesphere.api.user.UserRepository;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Reproduces production conditions: NO surrounding transaction/session (the test itself is NOT_SUPPORTED, like a
 * controller with spring.jpa.open-in-view=false). Reading the author after the repository call must not throw
 * LazyInitializationException.
 */
@DataJpaTest
@AutoConfigureTestDatabase
@TestPropertySource(properties = "spring.jpa.open-in-view=false")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class StoryRepositoryLazyLoadingTest {
    @Autowired StoryRepository stories;
    @Autowired UserRepository users;

    @AfterEach void cleanup() {
        stories.deleteAll();
        users.deleteAll();
    }

    private AppUser user(String name) {
        AppUser u = new AppUser();
        u.setUsername(name);
        u.setDisplayName("Display " + name);
        u.setEmail(name + "@example.test");
        u.setPasswordHash("x".repeat(60));
        return users.save(u);
    }

    @Test void activeStoriesCarryTheirAuthorWithoutASession() {
        AppUser maya = user("maya");
        stories.save(new Story(maya, "hello", "https://example.test/a.jpg"));

        List<Story> found = stories.findTop100ByExpiresAtAfterOrderByCreatedAtDesc(Instant.now());

        assertEquals(1, found.size());
        assertTrue(Hibernate.isInitialized(found.get(0).getUser()), "author must be fetched by the query");
        assertEquals("maya", found.get(0).getUser().getUsername());          // would throw if still lazy
        assertEquals("Display maya", found.get(0).getUser().getDisplayName());
    }

    @Test void expiredStoriesAreNotReturned() {
        AppUser maya = user("maya2");
        stories.save(new Story(maya, "old", "https://example.test/b.jpg"));
        assertTrue(stories.findTop100ByExpiresAtAfterOrderByCreatedAtDesc(Instant.now().plusSeconds(172800)).isEmpty());
    }
}
