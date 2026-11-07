package main

import (
	"errors"
	"net/url"
	"path/filepath"
	"strings"
)

// These roots are published by Asset_store through Resource_native. The host
// never derives graph identity or graph paths from its working directory.
type resourceGraphContext struct {
	Graph, GraphDir, AssetDir string
}

func (r *resourceRenderer) InstallGraphContext(payload string) error {
	var fields map[string]*string
	if err := platformObject(payload, &fields); err != nil {
		return err
	}
	for _, key := range []string{"graph", "graph-dir", "asset-dir"} {
		if fields[key] == nil {
			return errors.New("resource context requires graph and explicit roots")
		}
	}
	next := resourceGraphContext{*fields["graph"], *fields["graph-dir"], *fields["asset-dir"]}
	if strings.ContainsRune(next.Graph, 0) {
		return errors.New("invalid resource graph identity")
	}
	if next.Graph == "" {
		if next.GraphDir != "" || next.AssetDir != "" {
			return errors.New("closed graph must not retain resource roots")
		}
	} else {
		for _, root := range []string{next.GraphDir, next.AssetDir} {
			if !filepath.IsAbs(root) || strings.ContainsRune(root, 0) {
				return errors.New("resource graph roots must be absolute paths")
			}
		}
		next.GraphDir, next.AssetDir = filepath.Clean(next.GraphDir), filepath.Clean(next.AssetDir)
	}
	if r.closed {
		return errors.New("image renderer is closed")
	}
	if next != r.graph {
		for id := range r.owners {
			r.release(id)
		}
		r.graph = next
	}
	return nil
}

func resourceAssetFilename(filename string) bool {
	return filename != "" && filename != "." && filename != ".." &&
		!strings.ContainsAny(filename, "/\\\x00") && filename == filepath.Base(filename)
}

func (r *resourceRenderer) resolveGraphAsset(filename string) (string, error) {
	if r.graph.Graph == "" {
		return "", errors.New("graph asset requires an open graph")
	}
	if !resourceAssetFilename(filename) {
		return "", errors.New("invalid graph asset filename")
	}
	return filepath.Join(r.graph.AssetDir, filename), nil
}

func (r *resourceRenderer) resolveGraphSource(source string) (string, error) {
	if r.graph.Graph == "" {
		return "", errors.New("relative image source requires an open graph")
	}
	u, err := url.Parse(source)
	if err != nil || u.Scheme != "" || u.Host != "" || u.Opaque != "" || u.RawQuery != "" || u.Fragment != "" ||
		u.Path == "" || strings.ContainsAny(u.Path, "\\\x00") || strings.HasPrefix(u.Path, "/") {
		return "", errors.New("invalid graph-relative image source")
	}
	path := u.Path
	root := r.graph.GraphDir
	// Markdown links are commonly relative to pages/ (../assets/). Both
	// spellings refer to the same explicitly published asset directory.
	for _, prefix := range []string{"../assets/", "./assets/", "assets/"} {
		if strings.HasPrefix(path, prefix) {
			root, path = r.graph.AssetDir, strings.TrimPrefix(path, prefix)
			break
		}
	}
	resolved := filepath.Join(root, filepath.FromSlash(path))
	relative, err := filepath.Rel(root, resolved)
	if err != nil || relative == "." || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return "", errors.New("image source escapes its graph root")
	}
	return resolved, nil
}
