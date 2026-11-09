//go:build darwin || linux || windows

package main

import (
	"errors"
	"fmt"
	"unicode/utf8"

	"github.com/egoist/mygo"
)

type keychainOperation struct {
	ID        string  `json:"request-id"`
	Operation string  `json:"operation"`
	Service   string  `json:"service"`
	Account   string  `json:"account"`
	Value     *string `json:"value,omitempty"`
}

func keychainRequest(payload string) ([]platformReply, error) {
	var request keychainOperation
	if err := platformObject(payload, &request); err != nil {
		return nil, fmt.Errorf("invalid keychain request")
	}
	if request.ID == "" || request.Service == "" || request.Account == "" {
		return nil, fmt.Errorf("incomplete keychain request")
	}
	store := mygo.Secrets.Service(request.Service)
	var value []byte
	var err error
	switch request.Operation {
	case "get":
		value, err = store.Get(request.Account)
	case "set":
		if request.Value == nil {
			return nil, fmt.Errorf("keychain set requires a value")
		}
		err = store.Set(request.Account, []byte(*request.Value))
	case "delete":
		err = store.Delete(request.Account)
	default:
		return nil, fmt.Errorf("unknown keychain operation")
	}
	status := "ok"
	switch {
	case errors.Is(err, mygo.ErrSecretNotFound):
		status = "not-found"
	case errors.Is(err, errors.ErrUnsupported):
		status = "unsupported"
	case err != nil:
		status = "error"
	case !utf8.Valid(value):
		status = "invalid-data"
	}
	result := map[string]string{"request-id": request.ID, "status": status}
	if status == "ok" && request.Operation == "get" {
		result["value"] = string(value)
	}
	return platformJSONReply("keychain-result", result)
}
