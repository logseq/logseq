package main

import (
	"errors"
	"log"
	"unicode/utf8"

	"github.com/egoist/mygo/transfer"
	"github.com/egoist/mygo/ui"
	luimygo "github.com/logseq/lui/platform/mygo"
)

func clipboardPasteFormats(command string) []transfer.Format {
	if command == "pasteAndMatchStyle" {
		return []transfer.Format{transfer.Text}
	}
	return []transfer.Format{transfer.Text, transfer.HTML}
}

func (d *DocumentEvents) paste(c *ui.Context, target luimygo.InputNode, command string, data transfer.Data, readErr error) bool {
	if readErr != nil {
		if errors.Is(readErr, transfer.ErrFormat) {
			return false
		}
		log.Printf("logseq: clipboard paste read: %v", readErr)
		return true
	}
	clipboard := map[string]string{}
	failed := false
	for _, format := range clipboardPasteFormats(command) {
		if _, ok := data.Preferred(format); ok {
			value, err := data.Read(format)
			if err != nil {
				log.Printf("logseq: clipboard paste %s: %v", format, err)
				failed = true
				continue
			}
			if !utf8.Valid(value) {
				log.Printf("logseq: clipboard paste %s: invalid UTF-8", format)
				failed = true
				continue
			}
			clipboard[string(format)] = string(value)
		}
	}
	if len(clipboard) == 0 {
		return failed
	}
	return d.send(c, target, "paste", map[string]any{"nativeCommand": command, "clipboardData": clipboard})
}
