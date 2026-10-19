package com.vibesphere.api.safety;
import com.vibesphere.api.user.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
@RestController @RequestMapping("/safety")
public class SafetyController {
 public record CreateReport(@Pattern(regexp="USER|POST|COMMENT|MESSAGE") String targetType,@NotNull Long targetId,@NotBlank @Size(max=100) String reason,@Size(max=1000) String details){}
 private final UserRepository users;private final ReportRepository reports;private final BlockRepository blocks;
 public SafetyController(UserRepository users,ReportRepository reports,BlockRepository blocks){this.users=users;this.reports=reports;this.blocks=blocks;}
 @PostMapping("/reports") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> report(Authentication a,@Valid @RequestBody CreateReport r){AppUser u=users.findByEmailIgnoreCase(a.getName()).orElseThrow();Report saved=reports.save(new Report(u,r.targetType(),r.targetId(),r.reason(),r.details()));return Map.of("id",saved.getId(),"status",saved.getStatus(),"createdAt",saved.getCreatedAt());}
 @PostMapping("/blocks/{userId}") public Map<String,Object> block(Authentication a,@PathVariable Long userId){AppUser u=users.findByEmailIgnoreCase(a.getName()).orElseThrow();if(u.getId().equals(userId))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Cannot block yourself");if(!users.existsById(userId))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"User not found");Block.Key key=new Block.Key();key.blockerId=u.getId();key.blockedId=userId;boolean blocked;if(blocks.existsById(key)){blocks.deleteById(key);blocked=false;}else{blocks.save(new Block(u.getId(),userId));blocked=true;}return Map.of("blocked",blocked,"userId",userId);}
}
