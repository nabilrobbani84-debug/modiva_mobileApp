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
    "/accounts": {
      "get": { "summary": "List accounts", "tags": ["accounts"], "security": [{ "BearerAuth": [] }], "responses": { "200": { "description": "OK" } } },
      "post": { "summary": "Create account", "tags": ["accounts"], "security": [{ "BearerAuth": [] }], "responses": { "201": { "description": "Created" } } }
    },
    "/transactions": {
      "get": { "summary": "List transactions", "tags": ["transactions"], "security": [{ "BearerAuth": [] }], "responses": { "200": { "description": "OK" } } }
    },
    "/transactions/deposit": {
      "post": { "summary": "Deposit", "tags": ["transactions"], "security": [{ "BearerAuth": [] }], "responses": { "201": { "description": "Created" } } }
    },
    "/transactions/withdraw": {
      "post": { "summary": "Withdraw", "tags": ["transactions"], "security": [{ "BearerAuth": [] }], "responses": { "201": { "description": "Created" } } }
    },
    "/transactions/transfer": {
      "post": { "summary": "Transfer", "tags": ["transactions"], "security": [{ "BearerAuth": [] }], "responses": { "201": { "description": "Created" } } }
    },
    "/reports/monthly-balances": {
      "get": { "summary": "Monthly balance series", "tags": ["reports"], "security": [{ "BearerAuth": [] }], "responses": { "200": { "description": "OK" } } }
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
	Title:            "FinTech Transaction Service API",
	Description:      "Account, transaction, and reporting APIs for FinTech Core.",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
