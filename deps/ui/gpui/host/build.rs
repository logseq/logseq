//! Links the OCaml complete object `native_embed.exe.o` (deps/ui/gpui,
//! dune modes `(native object)`) into this binary. The object folds in
//! `logseq_lui_bridge.c` and the OCaml runtime; the host then talks to
//! the `lui_ocaml_*` exports directly.
//!
//! Override the object path with `LOGSEQ_OCAML_OBJECT`; the default is the
//! dune output tree `deps/ui/_build/default/gpui/native_embed.exe.o`.
//! Build it first:
//!   cd deps/ui && opam exec --switch=5.5.0 -- dune build gpui/native_embed.exe.o

use std::env;
use std::path::PathBuf;

fn main() {
    let manifest = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let object = env::var("LOGSEQ_OCAML_OBJECT")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            manifest
                .ancestors()
                .nth(2) // deps/ui
                .expect("host crate must live at deps/ui/gpui/host")
                .join("_build/default/gpui/native_embed.exe.o")
        });

    if !object.exists() {
        panic!(
            "missing OCaml object: {}\n\
             build it first: cd deps/ui && opam exec -- dune build gpui/native_embed.exe.o",
            object.display()
        );
    }

    let object = object.canonicalize().unwrap();
    // MSVC link.exe treats a bare `.o` path as an option; give it the
    // explicit object argument form. Unix linkers take the path as-is.
    if cfg!(target_os = "windows") {
        // Each rustc-link-arg maps to exactly one linker argument — the
        // /INCLUDE symbol and the object path must be separate args, or
        // link.exe merges them into a bogus symbol name.
        println!("cargo:rustc-link-arg-bins=/INCLUDE:lui_ocaml_start");
        println!("cargo:rustc-link-arg-bins={}", object.display());
        // flexlink-produced objects need mingw runtime archives MSVC
        // doesn't ship (libpthread, libmingwex, libgcc, libmsvcrt import
        // stubs, flexdll glue). `LOGSEQ_OCAML_EXTRA_LINK_ARGS` is a
        // `;`-separated list of additional linker arguments.
        if let Ok(extra) = env::var("LOGSEQ_OCAML_EXTRA_LINK_ARGS") {
            for arg in extra.split(';').filter(|s| !s.is_empty()) {
                println!("cargo:rustc-link-arg-bins={arg}");
            }
        }
        println!("cargo:rerun-if-env-changed=LOGSEQ_OCAML_EXTRA_LINK_ARGS");
    } else {
        println!("cargo:rustc-link-arg={}", object.display());
        // OCaml runtime's external C deps on macOS/Linux.
        println!("cargo:rustc-link-lib=pthread");
        println!("cargo:rustc-link-lib=m");
    }
    println!("cargo:rerun-if-changed={}", object.display());
    println!("cargo:rerun-if-env-changed=LOGSEQ_OCAML_OBJECT");
}
