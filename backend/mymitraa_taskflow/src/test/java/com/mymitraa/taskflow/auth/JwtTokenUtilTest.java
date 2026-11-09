package com.mymitraa.taskflow.auth;

import com.mymitraa.taskflow.security.JwtTokenUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenUtilTest {

    private JwtTokenUtil jwtTokenUtil;
    private final String testSecret = "dGhpc2lzYXZlcnlzZWN1cmVqd3RzZWNyZXRmb3JteW1pdHJhYXRhc2tmbG93YXBwbGljYXRpb24yMDI2ZGV2";

    @BeforeEach
    void setUp() {
        jwtTokenUtil = new JwtTokenUtil();
        jwtTokenUtil.setSecret(testSecret);
        jwtTokenUtil.setExpirationMs(86400000L); // 24 hours in milliseconds
    }

    @Test
    @DisplayName("JWT-01: Token generation sets expiration to exactly 24 hours (86,400,000 ms)")
    void testJwtExpirationIsExactly24Hours() {
        long beforeTime = System.currentTimeMillis();
        String token = jwtTokenUtil.generateToken("testuser");
        long afterTime = System.currentTimeMillis();

        assertNotNull(token, "Generated JWT must not be null");
        assertFalse(token.isEmpty(), "Generated JWT must not be empty");

        Date expirationDate = jwtTokenUtil.getExpirationDateFromToken(token);
        assertNotNull(expirationDate, "Expiration date claim must exist");

        long expectedExpiryMin = beforeTime + 86400000L;
        long expectedExpiryMax = afterTime + 86400000L;

        assertTrue(expirationDate.getTime() >= expectedExpiryMin - 1000L,
                "Token expiration should be at least 24 hours from issuance");
        assertTrue(expirationDate.getTime() <= expectedExpiryMax + 1000L,
                "Token expiration should not exceed 24 hours from issuance");

        long diff = expirationDate.getTime() - beforeTime;
        // Verify diff is within 1000ms of exactly 86,400,000 ms (24 hours)
        assertTrue(Math.abs(diff - 86400000L) < 2000L,
                "Token lifespan must be exactly 86,400,000 milliseconds (24 hours)");
    }

    @Test
    @DisplayName("JWT-02: Two successful logins generate different signed tokens")
    void testTwoLoginsGenerateDifferentTokens() throws InterruptedException {
        String token1 = jwtTokenUtil.generateToken("testuser");
        Thread.sleep(10); // Ensure distinct issuedAt timestamp
        String token2 = jwtTokenUtil.generateToken("testuser");

        assertNotNull(token1);
        assertNotNull(token2);
        assertNotEquals(token1, token2, "Subsequent token generations must produce distinct signed JWTs");
    }

    @Test
    @DisplayName("JWT-03: Valid token returns correct subject username and validates successfully")
    void testValidTokenValidation() {
        String token = jwtTokenUtil.generateToken("deenesh-sabat");
        assertEquals("deenesh-sabat", jwtTokenUtil.getUsernameFromToken(token));
        assertTrue(jwtTokenUtil.validateToken(token, "deenesh-sabat"));
        assertFalse(jwtTokenUtil.validateToken(token, "wrong-user"));
    }

    @Test
    @DisplayName("JWT-04: Expired token is rejected")
    void testExpiredTokenRejection() {
        // Set expiration to negative duration (already expired)
        jwtTokenUtil.setExpirationMs(-10000L);
        String expiredToken = jwtTokenUtil.generateToken("testuser");

        assertFalse(jwtTokenUtil.validateToken(expiredToken, "testuser"),
                "Expired JWT must be rejected by validator");
    }

    @Test
    @DisplayName("JWT-05: Tampered token signature is rejected")
    void testTamperedTokenRejection() {
        String validToken = jwtTokenUtil.generateToken("testuser");
        // Tamper signature
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "XXXXX";

        assertFalse(jwtTokenUtil.validateToken(tamperedToken, "testuser"),
                "Tampered JWT signature must be rejected");
    }
}
