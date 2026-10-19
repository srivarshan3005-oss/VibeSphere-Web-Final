package com.vibesphere.api.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Like.Key> {
    Optional<Like> findByUserIdAndPostId(Long userId, Long postId);
    long countByPostId(Long postId);
    List<Like> findByUserIdAndPostIdIn(Long userId, Collection<Long> postIds);
    void deleteByPostId(Long postId);

    @Query(value = "select post_id as entityId, count(*) as cnt from post_likes where post_id in (:ids) group by post_id", nativeQuery = true)
    List<CountView> countByPostIds(@Param("ids") Collection<Long> ids);
}
