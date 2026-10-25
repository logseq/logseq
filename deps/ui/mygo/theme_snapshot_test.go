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
	light := map[string]string{"--lui-background": "rgb(255 0 0)", "--old": "#ff0000"}
	for _, snapshot := range []platformThemeSnapshot{
		{Mode: "light", Vars: light},
		{Mode: "dark", Vars: map[string]string{"--lui-background": "hsl(240 100% 50%)", "--old": "#0000ff"}},
	} {
		if err := s.InstallThemeSnapshot(snapshot); err != nil {
			t.Fatal(err)
		}
	}
	light["--lui-background"] = "#00ff00"
	s.state = &platformUIState{Data: map[string]string{"theme": "light"}}
	want, wantDark := ui.Hex("#ff0000"), false
	tester := ui.NewTester(func(c *ui.Context) {
		previous := c.Theme()
		defer c.SetTheme(previous)
		if err := s.ApplyTheme(c); err != nil {
			t.Fatal(err)
		}
		if got := c.Theme(); got.Dark != wantDark || got.Background != want {
			t.Fatalf("effective theme: dark=%v background=%v; want dark=%v background=%v", got.Dark, got.Background, wantDark, want)
		}
	}, 20, 20)
	want, wantDark = ui.Hex("#0000ff"), true
	s.state.Data["theme"] = "dark"
	tester.Frame()
	s.state.Data["theme"] = "system"
	want, wantDark = ui.Hex("#ff0000"), false
	tester.Frame()
	want, wantDark = ui.Hex("#0000ff"), true
	tester.SetDark(true)
	if err := s.InstallThemeSnapshot(platformThemeSnapshot{Mode: "dark", Vars: map[string]string{"--lui-background": "#00ff00"}}); err != nil {
		t.Fatal(err)
	}
	want = ui.Hex("#00ff00")
	tester.Frame()
	ui.NewTester(func(c *ui.Context) {
		if _, err := s.ThemeColor(c, "var(--old)"); err == nil {
			t.Fatal("stale variable survived mode/replacement")
		}
	}, 20, 20)
}
