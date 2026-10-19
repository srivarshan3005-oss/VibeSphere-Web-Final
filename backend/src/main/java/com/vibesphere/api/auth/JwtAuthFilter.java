package com.vibesphere.api.auth;
import com.vibesphere.api.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
 private final JwtService jwt; private final UserRepository users; private final AuthCookies cookies;
 public JwtAuthFilter(JwtService jwt,UserRepository users,AuthCookies cookies){this.jwt=jwt;this.users=users;this.cookies=cookies;}
 private static boolean isSafeMethod(String m){return "GET".equals(m)||"HEAD".equals(m)||"OPTIONS".equals(m);}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
  String h=req.getHeader("Authorization");
  String token=null;
  if(h!=null&&h.startsWith("Bearer ")){token=h.substring(7);}
  else{
   // Web client: session cookie. Cookie-authenticated writes must carry X-Requested-With (a header a cross-site
   // form post cannot set), on top of the SameSite cookie attribute, as CSRF defence in depth.
   token=cookies.read(req);
   if(token!=null&&!isSafeMethod(req.getMethod())&&req.getHeader("X-Requested-With")==null)token=null;
  }
  if(token!=null&&SecurityContextHolder.getContext().getAuthentication()==null){
   try{String email=jwt.extractSubject(token);if(jwt.isValid(token)&&users.findByEmailIgnoreCase(email).filter(u->u.isActive()).isPresent()){
    var auth=new UsernamePasswordAuthenticationToken(email,null,List.of(new SimpleGrantedAuthority("ROLE_USER")));
    SecurityContextHolder.getContext().setAuthentication(auth);
   }}catch(Exception ignored){}
  }
  chain.doFilter(req,res);
 }
}
