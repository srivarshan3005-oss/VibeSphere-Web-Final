package com.vibesphere.api.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Session cookie used by the web client. The JWT is delivered as an HttpOnly cookie so page scripts can never read it.
 * SameSite=Lax keeps it off cross-site POSTs; set app.auth.cookie-secure=true when serving over HTTPS.
 */
@Component
public class AuthCookies {
    private final String name;
    private final boolean secure;
    private final String sameSite;
    private final String path;
    private final long maxAgeSeconds;

    public AuthCookies(@Value("${app.auth.cookie-name:vs_session}") String name,
                       @Value("${app.auth.cookie-secure:false}") boolean secure,
                       @Value("${app.auth.cookie-same-site:Lax}") String sameSite,
                       @Value("${app.auth.cookie-path:/api}") String path,
                       @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.name = name;
        this.secure = secure;
        this.sameSite = sameSite;
        this.path = path;
        this.maxAgeSeconds = Math.max(1, expirationMs / 1000);
    }

    public void write(HttpServletResponse res, String jwt) {
        add(res, ResponseCookie.from(name, jwt).httpOnly(true).secure(secure).sameSite(sameSite).path(path).maxAge(Duration.ofSeconds(maxAgeSeconds)).build());
    }

    public void clear(HttpServletResponse res) {
        add(res, ResponseCookie.from(name, "").httpOnly(true).secure(secure).sameSite(sameSite).path(path).maxAge(Duration.ZERO).build());
    }

    /** The JWT carried by the session cookie, or null when the request has none. */
    public String read(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) return c.getValue();
        }
        return null;
    }

    private static void add(HttpServletResponse res, ResponseCookie cookie) {
        res.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
