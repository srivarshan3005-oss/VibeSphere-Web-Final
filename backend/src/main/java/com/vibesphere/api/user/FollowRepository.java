package com.vibesphere.api.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Follow.Key> {
    Optional<Follow> findByFollowerIdAndFollowedId(Long followerId, Long followedId);
    long countByFollowedId(Long followedId);
    long countByFollowerId(Long followerId);
    boolean existsByFollowerIdAndFollowedId(Long followerId, Long followedId);
}
