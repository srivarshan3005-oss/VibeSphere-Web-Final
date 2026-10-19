package com.vibesphere.api.safety;
import com.vibesphere.api.user.AppUser;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="reports")
public class Report {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="reporter_id") private AppUser reporter;
 @Column(nullable=false,length=20) private String targetType;
 @Column(nullable=false) private Long targetId;
 @Column(nullable=false,length=100) private String reason;
 @Column(length=1000) private String details;
 @Column(nullable=false,length=20) private String status="OPEN";
 @Column(nullable=false,updatable=false) private Instant createdAt=Instant.now();
 protected Report(){} public Report(AppUser reporter,String type,Long targetId,String reason,String details){this.reporter=reporter;this.targetType=type;this.targetId=targetId;this.reason=reason;this.details=details;}
 public Long getId(){return id;}public String getStatus(){return status;}public Instant getCreatedAt(){return createdAt;}
}
