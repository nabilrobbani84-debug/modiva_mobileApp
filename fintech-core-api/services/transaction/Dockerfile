FROM golang:1.23-alpine AS build

WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/transaction-service ./services/transaction/cmd/api

FROM alpine:3.20

RUN adduser -D -H appuser
COPY --from=build /out/transaction-service /usr/local/bin/transaction-service
USER appuser

EXPOSE 8082
ENTRYPOINT ["transaction-service"]
