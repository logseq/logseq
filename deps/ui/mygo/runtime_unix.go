//go:build darwin || linux

package main

import (
	"unsafe"

	"github.com/ebitengine/purego"
)

func openNativeLibrary(path string) (uintptr, error) {
	return purego.Dlopen(path, purego.RTLD_NOW|purego.RTLD_LOCAL)
}

func nativeLibrarySymbol(handle uintptr, name string) (uintptr, error) {
	return purego.Dlsym(handle, name)
}

func closeNativeLibrary(handle uintptr) error { return purego.Dlclose(handle) }

func nativePatchCallback(fn func(unsafe.Pointer)) uintptr {
	return purego.NewCallback(fn)
}

func nativeSignalCallback(fn func()) uintptr { return purego.NewCallback(fn) }

func nativeBufferCallback(fn func(unsafe.Pointer, int32)) uintptr {
	return purego.NewCallback(fn)
}
