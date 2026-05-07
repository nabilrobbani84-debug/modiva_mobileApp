package grpc

import (
	"context"

	"github.com/modiva/fintech-core-api/services/auth/internal/security"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

const validateTokenFullMethod = "/auth.v1.AuthService/ValidateToken"

type authServiceServer interface {
	ValidateToken(context.Context, *wrapperspb.StringValue) (*structpb.Struct, error)
}

type Server struct {
	jwt *security.JWTService
}

func RegisterAuthService(registrar grpc.ServiceRegistrar, jwt *security.JWTService) {
	registrar.RegisterService(&grpc.ServiceDesc{
		ServiceName: "auth.v1.AuthService",
		HandlerType: (*authServiceServer)(nil),
		Methods: []grpc.MethodDesc{
			{
				MethodName: "ValidateToken",
				Handler:    validateTokenHandler,
			},
		},
		Streams:  []grpc.StreamDesc{},
		Metadata: "proto/auth/v1/auth.proto",
	}, &Server{jwt: jwt})
}

func (s *Server) ValidateToken(ctx context.Context, input *wrapperspb.StringValue) (*structpb.Struct, error) {
	claims, err := s.jwt.Parse(input.Value)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid token")
	}
	return structpb.NewStruct(map[string]interface{}{
		"user_id": claims.UserID,
		"email":   claims.Email,
		"role":    claims.Role,
	})
}

func validateTokenHandler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(wrapperspb.StringValue)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(authServiceServer).ValidateToken(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: validateTokenFullMethod,
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(authServiceServer).ValidateToken(ctx, req.(*wrapperspb.StringValue))
	}
	return interceptor(ctx, in, info, handler)
}
