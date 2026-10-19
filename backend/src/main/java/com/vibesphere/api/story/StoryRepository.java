package com.vibesphere.api.story;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {
    // Story.user is LAZY and spring.jpa.open-in-view=false, so the author must be fetched in the same query;
    // otherwise reading story.getUser().getUsername() after the repository call throws LazyInitializationException.
    @EntityGraph(attributePaths = "user")
    List<Story> findTop100ByExpiresAtAfterOrderByCreatedAtDesc(Instant now);
}
