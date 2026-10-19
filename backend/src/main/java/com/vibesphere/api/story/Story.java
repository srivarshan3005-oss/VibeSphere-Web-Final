package com.vibesphere.api.story;
import com.vibesphere.api.user.AppUser;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="stories")
public class Story {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id") private AppUser user;
 @Column(length=500) private String caption;
 @Column(nullable=false,length=2048) private String mediaUrl;
 @Column(nullable=false) private Instant createdAt=Instant.now();
 @Column(nullable=false) private Instant expiresAt=Instant.now().plusSeconds(86400);
 protected Story(){}
 public Story(AppUser user,String caption,String mediaUrl){this.user=user;this.caption=caption;this.mediaUrl=mediaUrl;}
 public Long getId(){return id;}public AppUser getUser(){return user;}public String getCaption(){return caption;}public String getMediaUrl(){return mediaUrl;}public Instant getCreatedAt(){return createdAt;}public Instant getExpiresAt(){return expiresAt;}
}
