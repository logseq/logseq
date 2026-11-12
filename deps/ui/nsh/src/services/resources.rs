//! OCaml-owned graph roots projected to the existing native image loader.
//! This stores metadata only: no file reads, image bytes, loader or resource cache.
use nsh_core::{element::ImageSrc, prelude::*};
use serde::Deserialize;
use std::path::{Component, Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields)]
struct Graph {
    graph: String,
    #[serde(rename = "graph-dir")]
    graph_dir: PathBuf,
    #[serde(rename = "asset-dir")]
    asset_dir: PathBuf,
}
impl Graph {
    fn parse(payload: &str) -> Result<Option<Self>, String> {
        let graph: Self =
            serde_json::from_str(payload).map_err(|error| format!("resource-context: {error}"))?;
        if graph.graph.contains('\0') {
            return Err("resource graph identity contains NUL".into());
        }
        if graph.graph.is_empty() {
            if !graph.graph_dir.as_os_str().is_empty() || !graph.asset_dir.as_os_str().is_empty() {
                return Err("closed graph must not retain resource roots".into());
            }
            return Ok(None);
        }
        for root in [&graph.graph_dir, &graph.asset_dir] {
            if !root.is_absolute() || root.to_string_lossy().contains('\0') {
                return Err("resource graph roots must be absolute paths".into());
            }
        }
        Ok(Some(graph))
    }
    fn resolve(&self, source: Source) -> Result<String, String> {
        let path = match source {
            Source::Direct(source) => return Ok(source),
            Source::Asset(filename) => self.asset_dir.join(filename),
            Source::Relative(path) => {
                let (root, relative) = ["../assets/", "./assets/", "assets/"]
                    .into_iter()
                    .find_map(|prefix| {
                        path.strip_prefix(prefix)
                            .map(|path| (&self.asset_dir, path))
                    })
                    .unwrap_or((&self.graph_dir, path.as_str()));
                let mut result = root.clone();
                let mut depth = 0;
                for component in Path::new(relative).components() {
                    match component {
                        Component::Normal(part) => {
                            result.push(part);
                            depth += 1;
                        }
                        Component::CurDir => {}
                        Component::ParentDir if depth > 0 => {
                            result.pop();
                            depth -= 1;
                        }
                        _ => return Err("image source escapes its graph root".into()),
                    }
                }
                if depth == 0 {
                    return Err("image source must name a graph file".into());
                }
                result
            }
        };
        path.into_os_string()
            .into_string()
            .map_err(|_| "image path is not UTF-8".into())
    }
}

enum Source {
    Direct(String),
    Asset(String),
    Relative(String),
}
fn decoded_path(source: &str) -> Result<String, String> {
    let mut decoded = Vec::with_capacity(source.len());
    let mut bytes = source.as_bytes().iter().copied();
    while let Some(byte) = bytes.next() {
        if byte == b'%' {
            let digit = |byte: Option<u8>| byte.and_then(|byte| (byte as char).to_digit(16));
            let high = digit(bytes.next()).ok_or("invalid image path escape")?;
            let low = digit(bytes.next()).ok_or("invalid image path escape")?;
            decoded.push((high * 16 + low) as u8);
        } else {
            decoded.push(byte);
        }
    }
    String::from_utf8(decoded).map_err(|_| "image path escape is not UTF-8".into())
}
fn classify(source: &str, asset: Option<&str>) -> Result<Source, String> {
    if let Some(filename) = asset.filter(|name| !name.is_empty()) {
        if matches!(filename, "." | "..")
            || filename.contains(['/', '\\', '\0'])
            || Path::new(filename)
                .file_name()
                .is_none_or(|name| name != filename)
        {
            return Err("invalid graph asset filename".into());
        }
        // The OCaml asset identity overrides a source retained from another graph.
        return Ok(Source::Asset(filename.into()));
    }
    if source.contains('\0') || source.starts_with("//") {
        return Err("invalid image source".into());
    }
    if source.is_empty() || Path::new(source).is_absolute() {
        return Ok(Source::Direct(source.into()));
    }
    if let Ok(url) = url::Url::parse(source) {
        match url.scheme() {
            "http" | "https"
                if url.host_str().is_some()
                    && url.username().is_empty()
                    && url.password().is_none() => {}
            "data" if url.path().starts_with("image/") => {}
            "file"
                if matches!(url.host_str(), None | Some("localhost"))
                    && url.username().is_empty()
                    && url.password().is_none()
                    && url.query().is_none()
                    && url.fragment().is_none()
                    && url.to_file_path().is_ok_and(|path| path.is_absolute()) => {}
            _ => return Err("unsupported image URL or credentials".into()),
        }
        return Ok(Source::Direct(url.to_string()));
    }
    if source.contains([':', '?', '#', '\\']) {
        return Err("invalid graph-relative image source".into());
    }
    let path = decoded_path(source)?;
    if path.contains(['\\', '\0']) || Path::new(&path).is_absolute() {
        return Err("invalid graph-relative image path".into());
    }
    // Check ownership before publication without consulting the active graph.
    let probe = Graph {
        graph: "validation".into(),
        graph_dir: PathBuf::from("."),
        asset_dir: PathBuf::from("."),
    };
    probe.resolve(Source::Relative(path.clone()))?;
    Ok(Source::Relative(path))
}

pub(crate) fn validate_source(source: &str, asset: Option<&str>) -> Result<(), String> {
    classify(source, asset).map(|_| ())
}

#[derive(Debug, PartialEq, Eq)]
pub(crate) enum AssetLocation {
    Path(PathBuf),
    Url(String),
}
fn asset_location(source: Source) -> Result<AssetLocation, String> {
    let Source::Direct(source) = source else {
        return Err("managed asset location was not resolved".into());
    };
    if Path::new(&source).is_absolute() {
        return Ok(AssetLocation::Path(source.into()));
    }
    let url = url::Url::parse(&source).map_err(|_| "invalid managed asset URL")?;
    match url.scheme() {
        "file" => url
            .to_file_path()
            .map(AssetLocation::Path)
            .map_err(|_| "invalid managed local asset URL".into()),
        "http" | "https" => Ok(AssetLocation::Url(source)),
        _ => Err("managed asset links require a local file or HTTP(S) URL".into()),
    }
}

pub(crate) fn validate_asset_link(
    graph: &str,
    source: &str,
    asset: Option<&str>,
) -> Result<(), String> {
    if graph.is_empty() || graph.contains('\0') {
        return Err("managed asset links require their graph identity".into());
    }
    let source = classify(source, asset)?;
    if matches!(source, Source::Direct(_)) {
        asset_location(source)?;
    }
    Ok(())
}

/// One app-owned signal; only graph-relative image bindings read it.
#[derive(Clone, Copy)]
pub(crate) struct Resources(Signal<Option<Graph>>);
impl Resources {
    pub(crate) fn new() -> Self {
        Self(signal(None))
    }
    pub(crate) fn install(&self, payload: &str) -> Result<(), String> {
        let next = Graph::parse(payload)?;
        if self.0.get_untracked() != next {
            self.0.set(next);
        }
        Ok(())
    }
    pub(crate) fn source(&self, source: &str, asset: Option<&str>) -> Result<ImageSrc, String> {
        let source = classify(source, asset)?;
        if let Source::Direct(source) = source {
            return Ok(ImageSrc::from(source));
        }
        // Graph close clears the old source synchronously, before its retiring
        // patch. A later graph never displays the previous graph's asset path.
        match self.0.get() {
            Some(graph) => graph.resolve(source).map(ImageSrc::from),
            None => Ok(ImageSrc::from("")),
        }
    }
    /// Resolve only against the graph captured by the asset view. A retained
    /// link cannot redirect to a later graph, even when its filename repeats.
    pub(crate) fn asset_link(
        &self,
        graph: &str,
        source: &str,
        asset: Option<&str>,
    ) -> Result<Option<AssetLocation>, String> {
        validate_asset_link(graph, source, asset)?;
        let Some(current) = self.0.get().filter(|current| current.graph == graph) else {
            return Ok(None);
        };
        asset_location(Source::Direct(current.resolve(classify(source, asset)?)?)).map(Some)
    }
}

#[cfg(test)]
mod tests;
