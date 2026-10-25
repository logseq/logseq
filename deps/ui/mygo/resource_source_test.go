package main

import "testing"

func TestResourceSourcesStayInExplicitProtocols(t *testing.T) {
	for _, tc := range []struct {
		url, kind, value string
	}{
		{"https://example.org/image.png", "url", "https://example.org/image.png"},
		{"http://example.org/image.png", "url", "http://example.org/image.png"},
		{"data:image/png;base64,aGVsbG8=", "data", "data:image/png;base64,aGVsbG8="},
		{"file:///tmp/a%20b.png", "file", "/tmp/a b.png"},
		{"file://localhost/tmp/image.png", "file", "/tmp/image.png"},
		{"/tmp/image.png", "file", "/tmp/image.png"},
		{"assets/image.png", "", ""},
		{"../assets/image.png", "", ""},
		{"//remote/image.png", "", ""},
		{"asset://plugin/image.png", "", ""},
		{"blob:graph/image", "", ""},
		{"javascript:alert(1)", "", ""},
		{"ftp://example.org/image.png", "", ""},
		{"file://remote/tmp/image.png", "", ""},
		{"file:relative.png", "", ""},
		{"file:///tmp/image.png?query", "", ""},
		{"https://user:password@example.org/image.png", "", ""},
		{"/tmp/image\x00.png", "", ""},
	} {
		t.Run(tc.url, func(t *testing.T) {
			source, err := resourceSourceForURL(tc.url)
			if tc.kind == "" {
				if err == nil {
					t.Fatal("unsupported source admitted")
				}
				return
			}
			if err != nil || source.kind != tc.kind || source.value != tc.value {
				t.Fatalf("source = %#v, error = %v; want %q %q", source, err, tc.kind, tc.value)
			}
		})
	}
}
