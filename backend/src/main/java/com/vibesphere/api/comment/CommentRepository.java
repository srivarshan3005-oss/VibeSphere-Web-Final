package com.vibesphere.api.comment;

import com.vibesphere.api.post.CountView;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @EntityGraph(attributePaths = "user")
    List<Comment> findByPostId(Long postId, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Optional<Comment> findWithUserById(Long id);

    void deleteByPostId(Long postId);
    void deleteByParentId(Long parentId);

    @Query(value = "select post_id as entityId, count(*) as cnt from comments where post_id in (:ids) group by post_id", nativeQuery = true)
    List<CountView> countByPostIds(@Param("ids") Collection<Long> ids);
}
