FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN chmod +x mvnw && ./mvnw -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/foodbridge-0.0.1-SNAPSHOT.jar app.jar
CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar /app/app.jar"]