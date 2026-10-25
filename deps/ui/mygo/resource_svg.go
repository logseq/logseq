package main

import (
	"bytes"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"regexp"
	"sort"
	"strings"

	luimygo "github.com/logseq/lui/platform/mygo"
)

const resourceMaxSVGNodes = 4096

var resourceSVGURL = regexp.MustCompile(`(?i)url\s*\(\s*['"]?([^)'"\s]+)`)

func resourceSVGElement(tag string) bool {
	switch tag {
	case "svg", "path", "circle", "rect", "line", "polyline", "polygon", "ellipse",
		"g", "defs", "use", "symbol", "clipPath", "mask", "linearGradient", "radialGradient",
		"stop", "style", "title", "desc", "metadata":
		return true
	}
	return false
}

func resourceSVGValue(name, value string) error {
	name = strings.ToLower(name)
	if strings.HasPrefix(name, "on") || name == "filter" || strings.HasPrefix(name, "marker") {
		return fmt.Errorf("unsupported SVG attribute %s", name)
	}
	if name == "href" && !strings.HasPrefix(strings.TrimSpace(value), "#") {
		return errors.New("SVG references must be local fragment identifiers")
	}
	for _, match := range resourceSVGURL.FindAllStringSubmatch(value, -1) {
		if !strings.HasPrefix(match[1], "#") {
			return errors.New("external SVG paint references are unsupported")
		}
	}
	if name == "style" {
		lower := strings.ToLower(value)
		for _, unsupported := range []string{"@", "filter:", "filter :", "marker", "animation"} {
			if strings.Contains(lower, unsupported) {
				return errors.New("SVG style uses an unsupported feature")
			}
		}
	}
	return nil
}

// Reject features MyGo otherwise omits, rather than report a partially decoded
// document as a fully supported image. SVG has no external resource loader.
func resourceValidateSVG(payload []byte) error {
	decoder := xml.NewDecoder(bytes.NewReader(payload))
	count, depth, roots := 0, 0, 0
	styleDepth := 0
	var style strings.Builder
	for {
		token, err := decoder.Token()
		if err == io.EOF {
			if roots != 1 || depth != 0 {
				return errors.New("SVG requires one root element")
			}
			return nil
		}
		if err != nil {
			return errors.New("invalid SVG XML")
		}
		switch token := token.(type) {
		case xml.StartElement:
			count++
			depth++
			if depth == 1 {
				roots++
				if token.Name.Local != "svg" {
					return errors.New("image XML root is not svg")
				}
			}
			if count > resourceMaxSVGNodes || depth > 128 {
				return errors.New("SVG exceeds retained tree limits")
			}
			if (token.Name.Space != "" && token.Name.Space != "http://www.w3.org/2000/svg") || !resourceSVGElement(token.Name.Local) {
				return fmt.Errorf("unsupported SVG element %s", token.Name.Local)
			}
			for _, attr := range token.Attr {
				if err := resourceSVGValue(attr.Name.Local, attr.Value); err != nil {
					return err
				}
			}
			if token.Name.Local == "style" {
				styleDepth = depth
				style.Reset()
			}
		case xml.EndElement:
			if depth == styleDepth {
				if err := resourceSVGValue("style", style.String()); err != nil {
					return err
				}
				styleDepth = 0
			}
			depth--
		case xml.CharData:
			if styleDepth > 0 {
				style.Write(token)
			} else if depth == 0 && strings.TrimSpace(string(token)) != "" {
				return errors.New("text outside SVG root")
			}
		case xml.Directive:
			return errors.New("SVG document directives are unsupported")
		case xml.ProcInst:
			if token.Target != "xml" {
				return errors.New("SVG processing instructions are unsupported")
			}
		}
	}
}

func resourceRetainedSVG(node func(int64) (luimygo.Node, bool), root luimygo.Node) (string, error) {
	var out bytes.Buffer
	encoder := xml.NewEncoder(&out)
	count := 0
	var write func(luimygo.Node, int) error
	write = func(n luimygo.Node, depth int) error {
		count++
		if count > resourceMaxSVGNodes || depth > 128 || out.Len() > 1<<20 {
			return errors.New("inline SVG exceeds retained tree limits")
		}
		tag := strings.TrimPrefix(n.Identifier, "logseq-")
		if !resourceSVGElement(tag) {
			return fmt.Errorf("unsupported retained SVG element %s", tag)
		}
		attrs := extensionAttrs(n)
		names := make([]string, 0, len(attrs))
		for name := range attrs {
			names = append(names, name)
		}
		sort.Strings(names)
		start := xml.StartElement{Name: xml.Name{Local: tag}}
		for _, name := range names {
			if name == "xmlns" || name == "xmlns:xlink" {
				continue
			}
			local := strings.TrimPrefix(name, "xlink:")
			if err := resourceSVGValue(local, attrs[name]); err != nil {
				return err
			}
			start.Attr = append(start.Attr, xml.Attr{Name: xml.Name{Local: local}, Value: attrs[name]})
		}
		if err := encoder.EncodeToken(start); err != nil {
			return err
		}
		if text := n.String("text"); text != "" {
			if tag != "style" && tag != "title" && tag != "desc" && tag != "metadata" {
				return errors.New("SVG text rendering is unsupported; convert text to paths")
			}
			if err := encoder.EncodeToken(xml.CharData(text)); err != nil {
				return err
			}
		}
		for _, id := range n.Children {
			child, ok := node(id)
			if !ok {
				return errors.New("retained SVG child is missing")
			}
			if err := write(child, depth+1); err != nil {
				return err
			}
		}
		return encoder.EncodeToken(start.End())
	}
	if err := write(root, 0); err != nil {
		return "", err
	}
	if err := encoder.Flush(); err != nil {
		return "", err
	}
	if out.Len() > 1<<20 {
		return "", errors.New("inline SVG exceeds byte limit")
	}
	return out.String(), nil
}
