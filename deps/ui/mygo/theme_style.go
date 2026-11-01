//go:build darwin || linux

package main

import (
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func applyThemeTypography(theme *ui.Theme, variables map[string]string) error {
	if _, present := variables["--lx-font-stack"]; present {
		family, ok := luimygo.ResolveThemeValue("var(--lx-font-stack)", variables)
		if !ok || strings.TrimSpace(family) == "" {
			return fmt.Errorf("application theme requires a resolved font stack")
		}
		theme.Font = family
	}
	if _, present := variables["--lx-root-text-size"]; present {
		value, ok := luimygo.ResolveThemeValue("var(--lx-root-text-size)", variables)
		number, pixels := strings.CutSuffix(strings.TrimSpace(value), "px")
		size, err := strconv.ParseFloat(number, 32)
		if !ok || !pixels || err != nil || size <= 0 || math.IsNaN(size) || math.IsInf(size, 0) {
			return fmt.Errorf("application theme requires a positive pixel root text size")
		}
		theme.FontSize = float32(size)
	}
	return nil
}

// ThemeColor shares Backend's scoped defaults and nested var/fallback/cycle
// handling. Invoke while rendering, so a subtree theme remains authoritative.
func (s *platformServices) ThemeColor(c *ui.Context, value string) (ui.Color, error) {
	color, err := s.backend.ResolveColor(c, value)
	if err != nil {
		return ui.Color{}, fmt.Errorf("application theme color %q: %w", value, err)
	}
	return color, nil
}

// ApplyElementColor is a narrow paint adapter, not a declaration parser or
// stylesheet engine. The raw-element owner selects the authored declaration;
// unsupported properties return false and must be handled/reported by it.
func (s *platformServices) ApplyElementColor(c *ui.Context, e ui.Element, property, value string) (bool, error) {
	property = strings.ToLower(strings.TrimSpace(property))
	if property != "background" && property != "background-color" && property != "color" && property != "border-color" {
		return false, nil
	}
	color, err := s.ThemeColor(c, value)
	if err != nil {
		return true, err
	}
	switch property {
	case "background", "background-color":
		e.Background(color)
	case "color":
		e.TextColor(color)
	case "border-color":
		e.BorderColor(color)
	}
	return true, nil
}
