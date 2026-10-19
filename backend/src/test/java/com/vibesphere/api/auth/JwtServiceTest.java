package com.vibesphere.api.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private static final String SECRET = "unit-test-secret-that-is-at-least-32-bytes-long!!";

    @Test void validTokenRoundTrips() {
        JwtService jwt = new JwtService(SECRET, 60_000);
        String token = jwt.generate("a@b.co");
        assertTrue(jwt.isValid(token));
        assertEquals("a@b.co", jwt.extractSubject(token));
    }

    @Test void expiredTokenIsRejected() throws Exception {
        JwtService jwt = new JwtService(SECRET, 1);
        String token = jwt.generate("a@b.co");
        Thread.sleep(25);
        assertFalse(jwt.isValid(token));
    }

    @Test void tokenSignedWithAnotherSecretIsRejected() {
        String token = new JwtService("another-secret-that-is-also-32-bytes-long-ok!!", 60_000).generate("a@b.co");
        assertFalse(new JwtService(SECRET, 60_000).isValid(token));
    }

    @Test void garbageIsRejected() { assertFalse(new JwtService(SECRET, 60_000).isValid("not.a.jwt")); }

    @Test void shortOrMissingSecretRefusesToStart() {
        assertThrows(IllegalArgumentException.class, () -> new JwtService("short", 1000));
        assertThrows(IllegalArgumentException.class, () -> new JwtService(null, 1000));
    }
}
