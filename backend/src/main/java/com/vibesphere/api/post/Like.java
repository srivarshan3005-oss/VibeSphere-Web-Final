package com.vibesphere.api.post;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
@Entity @Table(name="post_likes") @IdClass(Like.Key.class)
public class Like {
 @Id @Column(name="user_id") private Long userId;
 @Id @Column(name="post_id") private Long postId;
 @Column(nullable=false) private Instant createdAt=Instant.now();
 protected Like(){} public Like(Long userId,Long postId){this.userId=userId;this.postId=postId;}
 public Long getUserId(){return userId;}public Long getPostId(){return postId;}
 public static class Key implements Serializable {public Long userId;public Long postId;public Key(){}public Key(Long u,Long p){userId=u;postId=p;}}
}
