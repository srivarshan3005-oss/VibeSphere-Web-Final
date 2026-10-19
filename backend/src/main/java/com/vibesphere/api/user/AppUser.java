package com.vibesphere.api.user;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="users")
public class AppUser {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true,length=30) private String username;
 @Column(nullable=false,unique=true,length=254) private String email;
 @Column(nullable=false,length=100) private String passwordHash;
 @Column(nullable=false,length=80) private String displayName;
 @Column(length=300) private String bio;
 @Column(length=2048) private String avatarUrl;
 @Column(nullable=false) private boolean isPrivate=false;
 @Column(nullable=false) private boolean isActive=true;
 @Column(nullable=false,updatable=false) private Instant createdAt=Instant.now();
 public AppUser(){}
 public Long getId(){return id;} public String getUsername(){return username;} public void setUsername(String v){username=v;}
 public String getEmail(){return email;} public void setEmail(String v){email=v;}
 public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){passwordHash=v;}
 public String getDisplayName(){return displayName;} public void setDisplayName(String v){displayName=v;}
 public String getBio(){return bio;} public void setBio(String v){bio=v;}
 public String getAvatarUrl(){return avatarUrl;} public void setAvatarUrl(String v){avatarUrl=v;}
 public boolean isPrivate(){return isPrivate;} public void setPrivate(boolean v){isPrivate=v;}
 public boolean isActive(){return isActive;} public void setActive(boolean v){isActive=v;}
 public Instant getCreatedAt(){return createdAt;}
}
