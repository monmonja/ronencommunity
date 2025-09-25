import { RateLimiterMemory } from "rate-limiter-flexible";
import requestIP from "request-ip";

// Create once — shared across requests
const rateLimiter = new RateLimiterMemory({
  points: 240, // Allow 6 points
  duration: 120, // Per 120 seconds
});

export function rateLimiterMiddleware(req, res, next) {
  const remoteAddress = requestIP.getClientIp(req) || req.ip;

  rateLimiter.consume(remoteAddress, 2) // Consume 2 points
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send("Too Many Requests");
    });
}
