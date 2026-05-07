FROM golang:1.23-alpine AS build

WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/auth-service ./services/auth/cmd/api

FROM alpine:3.20

RUN adduser -D -H appuser
COPY --from=build /out/auth-service /usr/local/bin/auth-service
USER appuser

EXPOSE 8081 9091
ENTRYPOINT ["auth-service"]
