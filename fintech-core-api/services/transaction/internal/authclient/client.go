package authclient

import (
	"context"
	"errors"
	"time"

	"github.com/modiva/fintech-core-api/services/transaction/internal/domain"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

const validateTokenMethod = "/auth.v1.AuthService/ValidateToken"

type Client struct {
	conn *grpc.ClientConn
}

func New(target string) (*Client, error) {
	conn, err := grpc.NewClient(target, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return &Client{conn: conn}, nil
}

func (c *Client) Close() error {
	return c.conn.Close()
}

func (c *Client) ValidateToken(ctx context.Context, token string) (domain.Principal, error) {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	var response structpb.Struct
	if err := c.conn.Invoke(ctx, validateTokenMethod, wrapperspb.String(token), &response); err != nil {
		return domain.Principal{}, err
	}

	fields := response.GetFields()
	userID := fields["user_id"].GetStringValue()
	email := fields["email"].GetStringValue()
	role := fields["role"].GetStringValue()
	if userID == "" || role == "" {
		return domain.Principal{}, errors.New("auth response is missing principal fields")
	}
	return domain.Principal{UserID: userID, Email: email, Role: domain.Role(role)}, nil
}
