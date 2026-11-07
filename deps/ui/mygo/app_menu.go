package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/egoist/mygo"
)

type applicationMenuLabels struct {
	ToggleLeftSidebar string `json:"toggle-left-sidebar"`
	Documentation     string `json:"documentation"`
}

// OCaml supplies translated labels after loading its selected dictionary.
// Business commands return through the existing PlatformEvent contract.
func installApplicationMenu(labels applicationMenuLabels, dispatch func(platformReply) error) error {
	if strings.TrimSpace(labels.ToggleLeftSidebar) == "" || strings.TrimSpace(labels.Documentation) == "" {
		return fmt.Errorf("application menu requires translated labels")
	}
	if dispatch == nil {
		return fmt.Errorf("application menu requires OCaml event dispatch")
	}
	command := func(name string) func(*mygo.MenuItem, *mygo.Window) {
		return func(_ *mygo.MenuItem, _ *mygo.Window) {
			payload, err := json.Marshal(map[string]any{
				"detail": map[string]string{"command": name},
			})
			if err != nil {
				panic(err)
			}
			if err := dispatch(platformReply{Name: "application-menu-command", Payload: string(payload)}); err != nil {
				log.Printf("logseq: application menu %s: %v", name, err)
			}
		}
	}
	menu := mygo.NewMenu([]*mygo.MenuItem{
		{Role: mygo.RoleAppMenu},
		{Role: mygo.RoleFileMenu},
		{Role: mygo.RoleEditMenu},
		{Role: mygo.RoleViewMenu},
		{Role: mygo.RoleWindowMenu},
	})
	items := menu.Items()
	for _, item := range items {
		if item.Role != mygo.RoleViewMenu {
			continue
		}
		for _, child := range item.Submenu {
			if child.Role == mygo.RoleReload {
				child.Click = command("reload")
			}
		}
		item.Submenu = append(item.Submenu, mygo.Separator(), &mygo.MenuItem{
			Label: labels.ToggleLeftSidebar, Click: command("toggle-left-sidebar"),
		})
	}
	items = append(items, &mygo.MenuItem{Role: mygo.RoleHelp, Submenu: []*mygo.MenuItem{
		{Label: labels.Documentation, Click: command("documentation")},
	}})
	mygo.App.SetMenu(mygo.NewMenu(items))
	return nil
}
