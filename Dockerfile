FROM openjdk:8-jdk-alpine

# Install base packages
RUN \
    apk add --no-cache ca-certificates tini tzdata; \
    update-ca-certificates; \
    rm -rf /var/cache/apk/*;

# 时区
ENV TZ=Asia/Shanghai

EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
COPY ./reader.jar /app/bin/reader.jar
CMD ["java", "-Xmx256m", "-jar", "/app/bin/reader.jar" ]
