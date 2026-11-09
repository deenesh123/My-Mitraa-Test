package com.mymitraa.taskflow.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

@Component
public class JwtTokenUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenUtil.class);

    @Value("${jwt.secret:defaultSecretKeyForDevelopmentPurposesMustBeLongEnough1234567890}")
    private String secret;

    @Value("${mymitraa.security.jwt.expiration-ms:${jwt.expiration:86400000}}")
    private long expirationMs;

    public long getExpirationMs() {
        return expirationMs;
    }

    public void setExpirationMs(long expirationMs) {
        this.expirationMs = expirationMs;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getUsernameFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims != null ? claims.getSubject() : null;
    }

    public Date getExpirationDateFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims != null ? claims.getExpiration() : null;
    }

    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secret);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) {
                byte[] padded = new byte[32];
                System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
                return Keys.hmacShaKeyFor(padded);
            }
            return Keys.hmacShaKeyFor(keyBytes);
        }
    }

    public String generateToken(String username) {
        Date now = new Date();
        long duration = expirationMs <= 86400 ? expirationMs * 1000 : expirationMs;
        Date expiryDate = new Date(now.getTime() + duration);
        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSignKey())
                .compact();
    }

    public boolean validateToken(String token, String username) {
        try {
            String tokenUsername = getUsernameFromToken(token);
            return tokenUsername != null && tokenUsername.equals(username) && !isTokenExpired(token);
        } catch (Exception ex) {
            log.warn("Token validation failed: {}", ex.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiry = getExpirationDateFromToken(token);
        return expiry != null && expiry.before(new Date());
    }
}