package com.vibesphere.api.user;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
@Entity @Table(name="follows")
@IdClass(Follow.Key.class)
public class Follow {
 @Id @Column(name="follower_id") private Long followerId;
 @Id @Column(name="followed_id") private Long followedId;
 @Column(nullable=false) private Instant createdAt=Instant.now();
 protected Follow(){}
 public Follow(Long followerId,Long followedId){this.followerId=followerId;this.followedId=followedId;}
 public Long getFollowerId(){return followerId;} public Long getFollowedId(){return followedId;}
 public static class Key implements Serializable {public Long followerId;public Long followedId;public Key(){} public Key(Long f,Long t){followerId=f;followedId=t;}}
}
