//go:build darwin || linux

package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"mime"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/egoist/mygo"
)

type platformDesktopJob func(context.Context, *mygo.Window) ([]platformReply, error)

type platformDesktopServices struct {
	window   *mygo.Window
	complete func([]platformReply, error)
	ctx      context.Context
	cancel   context.CancelFunc
	jobs     []platformDesktopJob
	running  bool
	closed   bool
}

// StartDesktopServices attaches native dialogs to the host window. Completion
// runs on the UI thread; deliver replies even if an accompanying error needs
// reporting, so a failed picker does not leave an OCaml promise unresolved.
func (s *platformServices) StartDesktopServices(window *mygo.Window, complete func([]platformReply, error)) error {
	if window == nil || complete == nil || s.desktop.window != nil || s.desktop.closed {
		return fmt.Errorf("desktop services require a live window and one completion handler")
	}
	s.desktop.window, s.desktop.complete = window, complete
	s.desktop.ctx, s.desktop.cancel = context.WithCancel(context.Background())
	s.nextDesktopJob()
	return nil
}

// CloseDesktopServices cancels open pickers and drops late replies. Save/message
// dialogs have no cancellation API; jobs recheck cancellation before any write
// and before invoking the OCaml runtime, which may already have been closed.
func (s *platformServices) CloseDesktopServices() {
	s.desktop.closed = true
	s.desktop.jobs = nil
	if s.desktop.cancel != nil {
		s.desktop.cancel()
	}
}

func (s *platformServices) queueDesktopJob(job platformDesktopJob) error {
	if s.desktop.closed {
		return fmt.Errorf("desktop services are closed")
	}
	s.desktop.jobs = append(s.desktop.jobs, job)
	s.nextDesktopJob()
	return nil
}

func (s *platformServices) nextDesktopJob() {
	if s.desktop.closed || s.desktop.window == nil || s.desktop.running || len(s.desktop.jobs) == 0 {
		return
	}
	job := s.desktop.jobs[0]
	s.desktop.jobs[0] = nil
	s.desktop.jobs = s.desktop.jobs[1:]
	s.desktop.running = true
	ctx, window := s.desktop.ctx, s.desktop.window
	go func() {
		replies, err := job(ctx, window)
		mygo.RunOnMain(func() {
			if s.desktop.closed {
				return
			}
			s.desktop.running = false
			s.desktop.complete(replies, err)
			s.nextDesktopJob()
		})
	}()
}

func (s *platformServices) desktopFileRequest(op string, request map[string]json.RawMessage) error {
	if op == "open-file-picker" {
		var id int
		var multiple, directory bool
		if err := platformRequired(request, "request", &id); err != nil {
			return err
		}
		if err := platformRequired(request, "multiple", &multiple); err != nil {
			return err
		}
		if err := platformRequired(request, "directory", &directory); err != nil {
			return err
		}
		var accept string
		if raw, ok := request["accept"]; ok {
			if err := json.Unmarshal(raw, &accept); err != nil {
				return err
			}
		}
		filters := platformFileFilters(accept)
		return s.queueDesktopJob(func(ctx context.Context, window *mygo.Window) ([]platformReply, error) {
			paths, err := mygo.Dialog.OpenContext(ctx, mygo.OpenDialogOptions{Parent: window, Multiple: multiple, Directory: directory, Filters: filters})
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}
			files := make([]map[string]any, 0, len(paths))
			for _, path := range paths {
				info, statErr := os.Stat(path)
				if statErr != nil {
					err = errors.Join(err, statErr)
					continue
				}
				size := info.Size()
				if info.IsDir() {
					size = 0
				}
				files = append(files, map[string]any{"name": filepath.Base(path), "size": size, "path": path})
			}
			replies, encodeErr := platformJSONReply("files-picked", map[string]any{"request": id, "files": files})
			return replies, errors.Join(err, encodeErr)
		})
	}
	var name, mimeType, encoded string
	if err := platformRequired(request, "name", &name); err != nil {
		return err
	}
	if name == "" || filepath.Base(name) == "." || filepath.Base(name) == string(filepath.Separator) {
		return fmt.Errorf("download requires a filename")
	}
	if err := platformRequired(request, "mime", &mimeType); err != nil {
		return err
	}
	field := "text"
	if op == "download-binary" {
		field = "data-b64"
	}
	if err := platformRequired(request, field, &encoded); err != nil {
		return err
	}
	data := []byte(encoded)
	if op == "download-binary" {
		decoded, err := base64.StdEncoding.Strict().DecodeString(encoded)
		if err != nil {
			return fmt.Errorf("invalid download base64: %w", err)
		}
		data = decoded
	}
	// The requested filename, not the transport MIME, owns the export's
	// extension (application/octet-stream must not turn foo.edn into foo.bin).
	filters := platformFileFilters(filepath.Ext(name))
	return s.queueDesktopJob(func(ctx context.Context, window *mygo.Window) ([]platformReply, error) {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		path, err := mygo.Dialog.Save(mygo.SaveDialogOptions{Parent: window, DefaultPath: filepath.Base(name), Filters: filters, CreateDirectories: true})
		if err != nil || path == "" {
			return nil, err
		}
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		return nil, platformWriteDownload(path, data)
	})
}

// Confirm supports an asynchronous model producer without inventing a DOM
// request/reply shape. Supply translated labels from that producer.
func (s *platformServices) Confirm(message, accept, cancel string, complete func(bool, error)) error {
	if accept == "" || cancel == "" || complete == nil {
		return fmt.Errorf("confirmation requires translated buttons and a completion handler")
	}
	return s.queueDesktopJob(func(ctx context.Context, window *mygo.Window) ([]platformReply, error) {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		result, err := mygo.Dialog.Message(mygo.MessageOptions{Parent: window, Type: mygo.MessageQuestion, Message: message,
			Buttons: []string{accept, cancel}, DefaultButton: 1, CancelButton: 1})
		mygo.RunOnMain(func() {
			if !s.desktop.closed {
				complete(err == nil && result.Button == 0, err)
			}
		})
		return nil, nil
	})
}

func platformFileFilters(accept string) []mygo.FileFilter {
	var extensions []string
	for _, item := range strings.Split(accept, ",") {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		if strings.HasPrefix(item, ".") && !strings.ContainsAny(item, "/\\*?;") {
			extensions = append(extensions, strings.TrimPrefix(item, "."))
			continue
		}
		mediaType, _, err := mime.ParseMediaType(item)
		if err != nil || strings.Contains(mediaType, "*") {
			// Browser accept is advisory. Do not exclude valid files when the
			// native extension filter cannot express a requested MIME family.
			return nil
		}
		exts, err := mime.ExtensionsByType(mediaType)
		if err != nil || len(exts) == 0 {
			return nil
		}
		for _, ext := range exts {
			extensions = append(extensions, strings.TrimPrefix(ext, "."))
		}
	}
	if len(extensions) == 0 {
		return nil
	}
	slices.Sort(extensions)
	extensions = slices.Compact(extensions)
	return []mygo.FileFilter{{Name: accept, Extensions: extensions}}
}

func platformWriteDownload(path string, data []byte) (result error) {
	f, err := os.CreateTemp(filepath.Dir(path), ".logseq-download-*")
	if err != nil {
		return err
	}
	defer func() {
		if err := os.Remove(f.Name()); err != nil && !errors.Is(err, os.ErrNotExist) {
			result = errors.Join(result, err)
		}
	}()
	_, writeErr := f.Write(data)
	syncErr := f.Sync()
	closeErr := f.Close()
	if err := errors.Join(writeErr, syncErr, closeErr); err != nil {
		return err
	}
	return os.Rename(f.Name(), path)
}
