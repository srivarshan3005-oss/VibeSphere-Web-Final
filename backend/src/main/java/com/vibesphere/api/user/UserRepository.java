package com.vibesphere.api.user;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UserRepository extends JpaRepository<AppUser,Long> {
 Optional<AppUser> findByEmailIgnoreCase(String email);
 Optional<AppUser> findByUsernameIgnoreCase(String username);
 boolean existsByEmailIgnoreCase(String email);
 boolean existsByUsernameIgnoreCase(String username);
 List<AppUser> findTop20ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(String username,String displayName);
}
