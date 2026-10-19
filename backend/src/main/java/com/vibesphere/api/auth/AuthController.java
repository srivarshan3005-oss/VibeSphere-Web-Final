package com.vibesphere.api.auth;
import com.vibesphere.api.user.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
@RestController @RequestMapping("/auth")
public class AuthController {
 public record RegisterRequest(@NotBlank @Pattern(regexp="[A-Za-z0-9_]{3,30}") String username,@NotBlank @Size(max=80) String displayName,@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(min=8,max=72) String password){}
 public record LoginRequest(@NotBlank @Email String email,@NotBlank String password){}
 public record AuthResponse(String token,String tokenType,UserDto user){}
 private final UserRepository users;private final PasswordEncoder encoder;private final JwtService jwt;private final AuthCookies cookies;
 public AuthController(UserRepository users,PasswordEncoder encoder,JwtService jwt,AuthCookies cookies){this.users=users;this.encoder=encoder;this.jwt=jwt;this.cookies=cookies;}
 @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
 public AuthResponse register(@Valid @RequestBody RegisterRequest r,HttpServletResponse res){
  if(users.existsByEmailIgnoreCase(r.email()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already registered");
  if(users.existsByUsernameIgnoreCase(r.username()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Username is already taken");
  AppUser u=new AppUser();u.setUsername(r.username().trim());u.setDisplayName(r.displayName().trim());u.setEmail(r.email().trim().toLowerCase());u.setPasswordHash(encoder.encode(r.password()));
  u=users.save(u);String token=jwt.generate(u.getEmail());cookies.write(res,token);return new AuthResponse(token,"Bearer",UserDto.from(u));
 }
 @PostMapping("/login")
 public AuthResponse login(@Valid @RequestBody LoginRequest r,HttpServletResponse res){
  AppUser u=users.findByEmailIgnoreCase(r.email().trim()).filter(x->encoder.matches(r.password(),x.getPasswordHash())&&x.isActive()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid email or password"));
  String token=jwt.generate(u.getEmail());cookies.write(res,token);return new AuthResponse(token,"Bearer",UserDto.from(u));
 }
 /** Clears the HttpOnly session cookie (JavaScript cannot do this itself). */
 @PostMapping("/logout")
 public Map<String,Object> logout(HttpServletResponse res){cookies.clear(res);return Map.of("loggedOut",true);}
}
