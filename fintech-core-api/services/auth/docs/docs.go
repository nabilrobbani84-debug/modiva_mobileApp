package docs

import "github.com/swaggo/swag"

const docTemplate = `{
  "swagger": "2.0",
  "info": {
    "description": "{{escape .Description}}",
    "title": "{{.Title}}",
    "version": "{{.Version}}"
  },
  "basePath": "{{.BasePath}}",
  "paths": {
    "/auth/register": {
      "post": {
        "summary": "Register customer",
        "tags": ["auth"],
        "responses": { "201": { "description": "Created" } }
      }
    },
    "/auth/login": {
      "post": {
        "summary": "Login",
        "tags": ["auth"],
        "responses": { "200": { "description": "OK" } }
      }
    },
    "/me": {
      "get": {
        "summary": "Current user",
        "tags": ["auth"],
        "security": [{ "BearerAuth": [] }],
        "responses": { "200": { "description": "OK" } }
      }
    }
  },
  "securityDefinitions": {
    "BearerAuth": {
      "type": "apiKey",
      "name": "Authorization",
      "in": "header"
    }
  }
}`

var SwaggerInfo = &swag.Spec{
	Version:          "1.0",
	Host:             "",
	BasePath:         "/v1",
	Schemes:          []string{},
	Title:            "FinTech Auth Service API",
	Description:      "Authentication, JWT, and RBAC APIs for FinTech Core.",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
