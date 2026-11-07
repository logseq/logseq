package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/egoist/mygo"
)

// installApplicationMenu runs after App is ready. Business commands return to
// OCaml through the same PlatformEvent contract as other document events.
func installApplicationMenu(dispatch func(platformReply) error) error {
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
			Label: "Toggle Left Sidebar", Click: command("toggle-left-sidebar"),
		})
	}
	items = append(items, &mygo.MenuItem{Role: mygo.RoleHelp, Submenu: []*mygo.MenuItem{
		{Label: "Logseq Documentation", Click: command("documentation")},
	}})
	mygo.App.SetMenu(mygo.NewMenu(items))
	return nil
}
