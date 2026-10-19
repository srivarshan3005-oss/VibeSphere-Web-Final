package com.vibesphere.api.post;
import com.vibesphere.api.user.AppUser;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="posts")
public class Post {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id") private AppUser user;
 @Column(length=2200) private String caption;
 @Column(nullable=false,length=2048) private String mediaUrl;
 @Column(nullable=false,length=10) private String mediaType="IMAGE";
 @Column(nullable=false,length=20) private String visibility="PUBLIC";
 @Column(nullable=false,updatable=false) private Instant createdAt=Instant.now();
 public Post(){}
 public Post(AppUser user,String caption,String mediaUrl,String mediaType,String visibility){this.user=user;this.caption=caption;this.mediaUrl=mediaUrl;this.mediaType=mediaType;this.visibility=visibility;}
 public void setCaption(String c){this.caption=c;}
 public Long getId(){return id;}public AppUser getUser(){return user;}public String getCaption(){return caption;}public String getMediaUrl(){return mediaUrl;}public String getMediaType(){return mediaType;}public String getVisibility(){return visibility;}public Instant getCreatedAt(){return createdAt;}
}
