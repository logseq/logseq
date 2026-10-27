//go:build darwin || linux

package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"os"
	"path/filepath"
	"testing"
)

func TestDirectorySelectionSnapshot(t *testing.T) {
	for _, symlink := range []bool{false, true} {
		t.Run(map[bool]string{false: "relative-paths-and-bytes", true: "reject-symlink"}[symlink], func(t *testing.T) {
			root := t.TempDir()
			contents := map[string][]byte{
				"logseq/config.edn":       []byte("{}"),
				"pages/子目录/中文.md":         []byte("- nested page"),
				"assets/nested/empty.bin": {},
				"assets/nested/data.bin":  {0, 255, 128, 10},
			}
			for name, data := range contents {
				path := filepath.Join(root, filepath.FromSlash(name))
				if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(path, data, 0600); err != nil {
					t.Fatal(err)
				}
			}
			if symlink {
				if err := os.Symlink(t.TempDir(), filepath.Join(root, "pages", "linked")); err != nil {
					t.Fatal(err)
				}
			}
			files, err := platformPickedFiles(context.Background(), []string{root}, true)
			if symlink {
				if err == nil || len(files) != 0 {
					t.Fatal("symlink must reject the complete selection")
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if len(files) != len(contents) {
				t.Fatalf("got %d snapshots, want %d files", len(files), len(contents))
			}
			for _, file := range files {
				name, _ := file["name"].(string)
				want, ok := contents[name]
				if !ok {
					t.Fatalf("not a selected-root-relative file: %q", name)
				}
				encoded, _ := file["data-b64"].(string)
				data, err := base64.StdEncoding.DecodeString(encoded)
				if err != nil || !bytes.Equal(data, want) || file["size"] != int64(len(want)) {
					t.Fatalf("snapshot changed bytes for %q", name)
				}
				delete(contents, name)
			}
		})
	}
}
