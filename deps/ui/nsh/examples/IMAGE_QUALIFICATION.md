# Native Image HTTP qualification

Run on macOS with a fresh evidence directory:

```sh
cargo run --locked --manifest-path deps/ui/nsh/Cargo.toml \
  --example image_transport_qualification -- /tmp/logseq-image-http-new
```

The background runner uses the production LUI Renderer and NSH Image on the
actual macOS surface. Its private loopback server serves an owned PNG through a
redirect, records every request, and rejects any Referer header. A second URL
must decode and deliver a second native Load while keeping the same mounted
Image. It authors the gallery's eager policy, empty alt and 220x192 dimensions
and checks those native bounds. The runner writes `result.json` and quits
its own process. It neither activates an application nor changes display power.
The evidence and native data/cache directories stay outside the repository.

This exercises macOS's installed NSURLSession image transport, rather than the
core loader's standalone ureq fallback or a mock transport. It adds no loader,
cache or production fetch policy. Actual gallery-card recording tests separately
check the host-specific eager/no-page-Referer producer policy; this harness does
not open an OCaml gallery, establish image pixels, or qualify other operating
systems. Both producer and real transport evidence are required for that policy.
