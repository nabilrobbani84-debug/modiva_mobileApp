package domain

import "time"

type Role string

const (
	RoleCustomer Role = "customer"
	RoleAdmin    Role = "admin"
)

type Status string

const (
	StatusActive  Status = "active"
	StatusBlocked Status = "blocked"
)

type User struct {
	ID        string
	Email     string
	FullName  string
	Role      Role
	Status    Status
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (r Role) Valid() bool {
	return r == RoleCustomer || r == RoleAdmin
}
