package main

import (
	"syscall"
	"unsafe"

	"github.com/ebitengine/purego"
)

func openNativeLibrary(path string) (uintptr, error) {
	handle, err := syscall.LoadLibrary(path)
	return uintptr(handle), err
}

func nativeLibrarySymbol(handle uintptr, name string) (uintptr, error) {
	return syscall.GetProcAddress(syscall.Handle(handle), name)
}

func closeNativeLibrary(handle uintptr) error {
	return syscall.FreeLibrary(syscall.Handle(handle))
}

// Windows callbacks need a pointer-sized result even when C ignores it.
func nativePatchCallback(fn func(unsafe.Pointer)) uintptr {
	return purego.NewCallback(func(_ purego.CDecl, ptr unsafe.Pointer) uintptr {
		fn(ptr)
		return 0
	})
}

func nativeSignalCallback(fn func()) uintptr {
	return purego.NewCallback(func(_ purego.CDecl) uintptr {
		fn()
		return 0
	})
}

func nativeBufferCallback(fn func(unsafe.Pointer, int32)) uintptr {
	return purego.NewCallback(func(_ purego.CDecl, ptr unsafe.Pointer, length int32) uintptr {
		fn(ptr, length)
		return 0
	})
}
