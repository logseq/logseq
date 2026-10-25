package main

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	luimygo "github.com/logseq/lui/platform/mygo"
)

// Install before OCaml startup: its app-icons envelope then overrides bundled
// Tabler glyphs with Icons.app_icon_svgs. assetDir is LOGSEQ_NATIVE_ASSET_DIR
// after prepareNativeEnvironment has resolved the application-owned directory.
func installApplicationIcons(backend *luimygo.Backend, assetDir string) error {
	if !filepath.IsAbs(assetDir) {
		return fmt.Errorf("application icon asset directory must be absolute")
	}
	filename := filepath.Join(assetDir, "tabler-children.json")
	data, err := os.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("read application icons: %w", err)
	}
	var icons map[string][]json.RawMessage
	if err := json.Unmarshal(data, &icons); err != nil {
		return fmt.Errorf("decode application icons %s: %w", filename, err)
	}
	if len(icons) == 0 {
		return fmt.Errorf("application icon table %s is empty", filename)
	}
	names := make([]string, 0, len(icons))
	for name := range icons {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		svg, err := applicationIconSVG(name, icons[name])
		if err != nil {
			return fmt.Errorf("compose application icon %q: %w", name, err)
		}
		if err := backend.RegisterIcon("app:"+name, svg); err != nil {
			return fmt.Errorf("register application icon %q: %w", name, err)
		}
	}
	return nil
}

func applicationIconSVG(name string, children []json.RawMessage) ([]byte, error) {
	if len(children) == 0 {
		return nil, fmt.Errorf("bundled icon has no geometry")
	}
	// Match Icons.tabler_svg_attrs, not the framework's separate icon artwork.
	attrs := []xml.Attr{
		{Name: xml.Name{Local: "xmlns"}, Value: "http://www.w3.org/2000/svg"},
		{Name: xml.Name{Local: "width"}, Value: "24"},
		{Name: xml.Name{Local: "height"}, Value: "24"},
		{Name: xml.Name{Local: "viewBox"}, Value: "0 0 24 24"},
	}
	if strings.HasSuffix(name, "-filled") {
		attrs = append(attrs,
			xml.Attr{Name: xml.Name{Local: "fill"}, Value: "currentColor"},
			xml.Attr{Name: xml.Name{Local: "stroke"}, Value: "none"})
	} else {
		attrs = append(attrs,
			xml.Attr{Name: xml.Name{Local: "fill"}, Value: "none"},
			xml.Attr{Name: xml.Name{Local: "stroke"}, Value: "currentColor"},
			xml.Attr{Name: xml.Name{Local: "stroke-width"}, Value: "2"},
			xml.Attr{Name: xml.Name{Local: "stroke-linecap"}, Value: "round"},
			xml.Attr{Name: xml.Name{Local: "stroke-linejoin"}, Value: "round"})
	}
	var out bytes.Buffer
	encoder := xml.NewEncoder(&out)
	root := xml.StartElement{Name: xml.Name{Local: "svg"}, Attr: attrs}
	if err := encoder.EncodeToken(root); err != nil {
		return nil, err
	}
	for _, child := range children {
		var pair []json.RawMessage
		if err := json.Unmarshal(child, &pair); err != nil {
			return nil, err
		}
		if len(pair) != 2 {
			return nil, fmt.Errorf("bundled icon child must contain a tag and attributes")
		}
		var tag string
		var values map[string]string
		if err := json.Unmarshal(pair[0], &tag); err != nil {
			return nil, err
		}
		switch tag {
		case "path", "circle", "ellipse", "line", "polyline", "polygon", "rect":
		default:
			return nil, fmt.Errorf("unsupported bundled icon element %q", tag)
		}
		if err := json.Unmarshal(pair[1], &values); err != nil {
			return nil, err
		}
		if len(values) == 0 {
			return nil, fmt.Errorf("bundled icon element %q has no attributes", tag)
		}
		keys := make([]string, 0, len(values))
		for key := range values {
			keys = append(keys, key)
		}
		sort.Strings(keys)
		start := xml.StartElement{Name: xml.Name{Local: tag}}
		for _, key := range keys {
			start.Attr = append(start.Attr, xml.Attr{Name: xml.Name{Local: key}, Value: values[key]})
		}
		if err := encoder.EncodeToken(start); err != nil {
			return nil, err
		}
		if err := encoder.EncodeToken(start.End()); err != nil {
			return nil, err
		}
	}
	if err := encoder.EncodeToken(root.End()); err != nil {
		return nil, err
	}
	if err := encoder.Flush(); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}
