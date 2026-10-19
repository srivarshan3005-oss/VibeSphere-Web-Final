package com.vibesphere.api.post;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
    // The user association is LAZY and open-in-view is off, so every read that renders author data fetches it eagerly.
    @EntityGraph(attributePaths = "user")
    List<Post> findTop50ByVisibilityOrderByCreatedAtDesc(String visibility);

    @EntityGraph(attributePaths = "user")
    List<Post> findTop50ByUser_IdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = "user")
    List<Post> findByVisibility(String visibility, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    List<Post> findByUser_Id(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    List<Post> findByUser_IdAndVisibility(Long userId, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Optional<Post> findWithUserById(Long id);

    long countByUser_Id(Long userId);
}
