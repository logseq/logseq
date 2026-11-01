//go:build darwin || linux

package main

import (
	"testing"

	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func TestThemeSnapshotsFollowEffectiveModeAndReplacement(t *testing.T) {
	backend := luimygo.New(luimygo.Config{})
	defer backend.Close()
	s := newPlatformServices(backend)
	light := map[string]string{"--lui-background": "rgb(255 0 0)", "--old": "#ff0000", "--lx-font-stack": "Inter, system-ui, serif", "--lx-root-text-size": "16px"}
	for _, snapshot := range []platformThemeSnapshot{
		{Mode: "light", Vars: light},
		{Mode: "dark", Vars: map[string]string{"--lui-background": "hsl(240 100% 50%)", "--old": "#0000ff", "--lx-font-stack": "monospace, serif", "--lx-root-text-size": "20px"}},
	} {
		if err := s.InstallThemeSnapshot(snapshot); err != nil {
			t.Fatal(err)
		}
	}
	light["--lui-background"] = "#00ff00"
	s.state = &platformUIState{Data: map[string]string{"theme": "light"}}
	want, wantDark := ui.Hex("#ff0000"), false
	wantFont, wantSize := "Inter, system-ui, serif", float32(16)
	tester := ui.NewTester(func(c *ui.Context) {
		previous := c.Theme()
		defer c.SetTheme(previous)
		if err := s.ApplyTheme(c); err != nil {
			t.Fatal(err)
		}
		if got := c.Theme(); got.Dark != wantDark || got.Background != want {
			t.Fatalf("effective theme: dark=%v background=%v; want dark=%v background=%v", got.Dark, got.Background, wantDark, want)
		}
		if got := c.Theme(); got.Font != wantFont || got.Rem(1) != wantSize {
			t.Fatalf("effective typography: font=%q size=%g; want font=%q size=%g", got.Font, got.Rem(1), wantFont, wantSize)
		}
	}, 20, 20)
	want, wantDark = ui.Hex("#0000ff"), true
	wantFont, wantSize = "monospace, serif", 20
	s.state.Data["theme"] = "dark"
	tester.Frame()
	s.state.Data["theme"] = "system"
	want, wantDark = ui.Hex("#ff0000"), false
	wantFont, wantSize = "Inter, system-ui, serif", 16
	tester.Frame()
	want, wantDark = ui.Hex("#0000ff"), true
	wantFont, wantSize = "monospace, serif", 20
	tester.SetDark(true)
	if err := s.InstallThemeSnapshot(platformThemeSnapshot{Mode: "dark", Vars: map[string]string{"--lui-background": "#00ff00"}}); err != nil {
		t.Fatal(err)
	}
	want = ui.Hex("#00ff00")
	wantFont, wantSize = ui.DarkTheme().Font, ui.DarkTheme().Rem(1)
	tester.Frame()
	ui.NewTester(func(c *ui.Context) {
		if _, err := s.ThemeColor(c, "var(--old)"); err == nil {
			t.Fatal("stale variable survived mode/replacement")
		}
	}, 20, 20)
}
