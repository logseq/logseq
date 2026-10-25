package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	"io"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/egoist/mygo/ui"
)

const (
	resourceMaxBytes  = 32 << 20
	resourceMaxPixels = 8 << 20
)

type resourceSource struct{ kind, value string }

func resourceSourceForURL(raw string) (resourceSource, error) {
	if raw == "" || strings.ContainsRune(raw, 0) || strings.HasPrefix(raw, "//") {
		return resourceSource{}, errors.New("missing or invalid image source")
	}
	if filepath.IsAbs(raw) {
		return resourceSource{"file", filepath.Clean(raw)}, nil
	}
	u, err := url.Parse(raw)
	if err != nil {
		return resourceSource{}, errors.New("invalid image URL")
	}
	switch u.Scheme {
	case "data":
		return resourceSource{"data", raw}, nil
	case "http", "https":
		if u.Hostname() == "" || u.User != nil || u.Opaque != "" {
			return resourceSource{}, errors.New("image HTTP URL requires a host and no credentials")
		}
		return resourceSource{"url", raw}, nil
	case "file":
		if (u.Host != "" && u.Host != "localhost") || u.User != nil || u.RawQuery != "" || u.Fragment != "" ||
			u.Opaque != "" || !filepath.IsAbs(u.Path) || strings.ContainsRune(u.Path, 0) {
			return resourceSource{}, errors.New("file image URL must name an absolute local path")
		}
		return resourceSource{"file", filepath.Clean(u.Path)}, nil
	case "":
		return resourceSource{}, errors.New("relative image source requires an OCaml-owned resolver")
	default:
		return resourceSource{}, errors.New("unsupported image URL scheme")
	}
}

func resourceReadLimited(r io.Reader) ([]byte, error) {
	payload, err := io.ReadAll(io.LimitReader(r, resourceMaxBytes+1))
	if err != nil {
		return nil, err
	}
	if len(payload) > resourceMaxBytes {
		return nil, errors.New("image exceeds encoded byte limit")
	}
	return payload, nil
}

func resourceRead(ctx context.Context, source resourceSource) ([]byte, string, error) {
	switch source.kind {
	case "svg":
		return []byte(source.value), "image/svg+xml", nil
	case "data":
		header, body, ok := strings.Cut(strings.TrimPrefix(source.value, "data:"), ",")
		if !ok || len(body) > resourceMaxBytes*3 {
			return nil, "", errors.New("invalid or oversized image data URI")
		}
		isBase64 := strings.HasSuffix(header, ";base64")
		if isBase64 {
			header = strings.TrimSuffix(header, ";base64")
		}
		mediaType, _, err := mime.ParseMediaType(header)
		if err != nil || !strings.HasPrefix(mediaType, "image/") {
			return nil, "", errors.New("data URI must declare an image MIME type")
		}
		decoded, err := url.PathUnescape(body)
		if err != nil {
			return nil, "", errors.New("invalid data URI escaping")
		}
		var reader io.Reader = strings.NewReader(decoded)
		if isBase64 {
			reader = base64.NewDecoder(base64.StdEncoding, reader)
		}
		payload, err := resourceReadLimited(reader)
		return payload, mediaType, err
	case "url":
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, source.value, nil)
		if err != nil {
			return nil, "", errors.New("invalid image HTTP request")
		}
		req.Header.Set("Accept", "image/*")
		client := &http.Client{
			Timeout: 15 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 10 {
					return errors.New("too many image redirects")
				}
				_, err := resourceSourceForURL(req.URL.String())
				if err != nil || (req.URL.Scheme != "http" && req.URL.Scheme != "https") {
					return errors.New("unsupported image redirect")
				}
				return nil
			},
		}
		resp, err := client.Do(req)
		if err != nil {
			return nil, "", errors.New("image HTTP request failed")
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return nil, "", fmt.Errorf("image HTTP status %d", resp.StatusCode)
		}
		if resp.ContentLength > resourceMaxBytes {
			return nil, "", errors.New("image exceeds HTTP byte limit")
		}
		payload, err := resourceReadLimited(resp.Body)
		return payload, resp.Header.Get("Content-Type"), err
	case "file":
		info, err := os.Stat(source.value)
		if err != nil || !info.Mode().IsRegular() {
			return nil, "", errors.New("local image is not a readable regular file")
		}
		if info.Size() > resourceMaxBytes {
			return nil, "", errors.New("image exceeds file byte limit")
		}
		file, err := os.Open(source.value)
		if err != nil {
			return nil, "", errors.New("cannot open local image")
		}
		defer file.Close()
		payload, err := resourceReadLimited(file)
		return payload, "", err
	default:
		return nil, "", errors.New("unsupported resource kind")
	}
}

func resourceDecode(payload []byte, contentType string) (ui.ImageSource, float32, float32, error) {
	mediaType, _, _ := mime.ParseMediaType(contentType)
	trimmed := bytes.TrimSpace(bytes.TrimPrefix(payload, []byte{0xef, 0xbb, 0xbf}))
	if mediaType == "image/svg+xml" || bytes.HasPrefix(trimmed, []byte("<")) {
		if err := resourceValidateSVG(trimmed); err != nil {
			return nil, 0, 0, err
		}
		svg, err := ui.ParseSVG(trimmed)
		if err != nil {
			return nil, 0, 0, errors.New("cannot decode SVG image")
		}
		w, h := svg.Size()
		if !resourceValidSize(w, h) {
			return nil, 0, 0, errors.New("SVG size exceeds decoded image limit")
		}
		return svg, w, h, nil
	}
	config, _, err := image.DecodeConfig(bytes.NewReader(payload))
	if err != nil {
		return nil, 0, 0, errors.New("unsupported or invalid bitmap image")
	}
	if !resourceValidSize(float32(config.Width), float32(config.Height)) {
		return nil, 0, 0, errors.New("bitmap exceeds decoded pixel limit")
	}
	bitmap, err := ui.DecodeBitmap(payload)
	if err != nil {
		return nil, 0, 0, errors.New("cannot decode bitmap image")
	}
	w, h := bitmap.Size()
	return bitmap, float32(w), float32(h), nil
}

func resourceValidSize(w, h float32) bool {
	return w > 0 && h > 0 && float64(w)*float64(h) <= resourceMaxPixels
}
