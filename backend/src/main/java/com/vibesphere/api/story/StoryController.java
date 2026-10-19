package com.vibesphere.api.story;
import com.vibesphere.api.post.PostController;
import com.vibesphere.api.user.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.List;
@RestController @RequestMapping("/stories")
public class StoryController {
 public record CreateStory(@Size(max=500) String caption,@NotBlank @Size(max=2048) @Pattern(regexp=PostController.MEDIA_PATTERN,message="must be an http(s) URL or an uploaded file") String mediaUrl){}
 public record StoryDto(Long id,Long userId,String username,String displayName,String caption,String mediaUrl,Instant createdAt,Instant expiresAt){}
 private final StoryRepository stories;private final UserRepository users;
 public StoryController(StoryRepository stories,UserRepository users){this.stories=stories;this.users=users;}
 @GetMapping @Transactional(readOnly=true) public List<StoryDto> active(){return stories.findTop100ByExpiresAtAfterOrderByCreatedAtDesc(Instant.now()).stream().map(this::dto).toList();}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public StoryDto create(Authentication a,@Valid @RequestBody CreateStory r){AppUser u=users.findByEmailIgnoreCase(a.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));return dto(stories.save(new Story(u,r.caption(),r.mediaUrl())));}
 private StoryDto dto(Story s){return new StoryDto(s.getId(),s.getUser().getId(),s.getUser().getUsername(),s.getUser().getDisplayName(),s.getCaption(),s.getMediaUrl(),s.getCreatedAt(),s.getExpiresAt());}
}
