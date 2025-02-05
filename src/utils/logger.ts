import winston from "winston";

export const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log" }),
    new winston.transports.Console(),
    // In production, you might want to add services like CloudWatch or Datadog
    process.env.NODE_ENV === "production"
      ? new winston.transports.Http({
          host: "logging-service",
          port: 8080,
        })
      : new winston.transports.Console(),
  ],
});
