package com.vibesphere.api.safety;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
@Entity @Table(name="user_blocks") @IdClass(Block.Key.class)
public class Block {
 @Id @Column(name="blocker_id") private Long blockerId;
 @Id @Column(name="blocked_id") private Long blockedId;
 @Column(nullable=false) private Instant createdAt=Instant.now();
 protected Block(){}public Block(Long a,Long b){blockerId=a;blockedId=b;}
 public static class Key implements Serializable{public Long blockerId;public Long blockedId;public Key(){}}
}
