//go:build darwin || linux

package main

import (
	"fmt"
	"maps"
	"strings"

	"github.com/egoist/mygo/ui"
)

// InstallThemeSnapshot replaces one mode atomically. The OCaml producer owns
// root/body/application cascade and sends computed values, not raw layers.
func (s *platformServices) InstallThemeSnapshot(snapshot platformThemeSnapshot) error {
	if snapshot.Mode != "light" && snapshot.Mode != "dark" || snapshot.Vars == nil {
		return fmt.Errorf("theme snapshot requires light/dark mode and computed vars")
	}
	for name := range snapshot.Vars {
		if !strings.HasPrefix(name, "--") || len(name) <= 2 || strings.ContainsAny(name, " \t\r\n(),") {
			return fmt.Errorf("invalid theme custom property %q", name)
		}
	}
	snapshot.Vars = maps.Clone(snapshot.Vars)
	if s.snapshots == nil {
		s.snapshots = make(map[string]platformThemeSnapshot)
	}
	s.snapshots[snapshot.Mode] = snapshot
	return nil
}

// ApplyTheme runs before Backend.View, after sampling the real system theme.
// The caller restores its previous Context theme at the end of its View.
// Missing initial snapshots use the toolkit theme until the producer responds.
func (s *platformServices) ApplyTheme(c *ui.Context) error {
	base := c.Theme()
	if s.state != nil {
		switch mode := s.state.Data["theme"]; mode {
		case "light":
			base = ui.LightTheme()
		case "dark":
			base = ui.DarkTheme()
		case "", "system":
		default:
			return fmt.Errorf("invalid application theme mode %q", mode)
		}
	}
	next := *base
	mode := "light"
	if next.Dark {
		mode = "dark"
	}
	snapshot, exists := s.snapshots[mode]
	if !exists {
		if err := s.backend.SetThemeDefaults(nil); err != nil {
			return err
		}
		c.SetTheme(&next)
		return nil
	}
	tokens := maps.Clone(snapshot.Vars)
	if err := applyThemeTypography(&next, tokens); err != nil {
		return err
	}
	for _, name := range strings.Fields(`background foreground card card-foreground primary primary-foreground
secondary secondary-foreground accent accent-foreground muted muted-foreground destructive destructive-foreground
input ring border success success-foreground warning warning-foreground error error-foreground`) {
		if _, ok := tokens["--lui-"+name]; ok {
			tokens[name] = "var(--lui-" + name + ")"
		} else if _, ok := tokens["--"+name]; ok {
			tokens[name] = "hsl(var(--" + name + "))"
		}
	}
	if err := s.backend.SetThemeDefaults(tokens); err != nil {
		return err
	}
	previous := c.Theme()
	c.SetTheme(&next)
	for _, slot := range []struct {
		target *ui.Color
		value  string
	}{
		{&next.Background, "background"}, {&next.Text, "foreground"},
		{&next.Surface, "muted"}, {&next.TextMuted, "muted-foreground"},
		{&next.Border, "border"}, {&next.Accent, "primary"}, {&next.AccentText, "primary-foreground"},
		{&next.Danger, "destructive"}, {&next.Success, "success"}, {&next.Warning, "warning"},
		{&next.Focus, "ring"}, {&next.Inverse, "foreground"}, {&next.InverseText, "background"},
	} {
		if _, present := tokens[slot.value]; !present {
			continue
		}
		color, err := s.ThemeColor(c, slot.value)
		if err != nil {
			c.SetTheme(previous)
			return err
		}
		*slot.target = color
	}
	for _, slot := range []struct {
		target   *ui.Color
		variable string
	}{
		{&next.SurfaceHover, "--lx-menu-hover"}, {&next.SurfacePressed, "--lx-menu-selected"},
		{&next.AccentHover, "--ls-link-text-hover-color"}, {&next.AccentPressed, "--ls-active-primary-color"},
		{&next.Selection, "--ls-selection-background-color"}, {&next.Scrollbar, "--ls-scrollbar-foreground-color"},
	} {
		if _, present := tokens[slot.variable]; !present {
			continue
		}
		color, err := s.ThemeColor(c, "var("+slot.variable+")")
		if err != nil {
			c.SetTheme(previous)
			return err
		}
		*slot.target = color
	}
	return nil
}
