//! `logseq-katex` — math slots rendered through a LaTeX -> typst -> SVG
//! pipeline. typst-kit's embedded fonts (New Computer Modern Math) keep the
//! host self-contained; gpui's built-in `SvgRenderer` rasterizes the page
//! into a `RenderImage` at the window scale factor.
//!
//! The LaTeX -> typst translation in [`latex_to_typst`] covers a documented
//! subset of the commands logseq users actually write (see the unit tests);
//! a formula outside the subset degrades to the raw tex text instead of a
//! blank box.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, LazyLock, Mutex};

use gpui_kit::component::theme::ActiveTheme;
use gpui_kit::gpui::{
    div, img, AnyElement, Context, ImageSource, IntoElement, ParentElement, RenderImage,
    SharedString, Styled, SvgSize, Window,
};
use lui_core::store::NodeIdentity;
use lui_core::wire::Value;
use typst::diag::FileError;
use typst::foundations::{Bytes, Datetime, Duration};
use typst::LibraryExt;
use typst::syntax::{FileId, Source};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, World};
use typst_kit::fonts::FontStore;
use typst_svg::SvgOptions;

use lui_gpui::node_view::{LuiNodeView, NodeSnapshot};
use lui_gpui::style;

static FONTS: LazyLock<FontStore> = LazyLock::new(|| {
    let mut store = FontStore::new();
    store.extend(typst_kit::fonts::embedded());
    store
});

static LIBRARY: LazyLock<LazyHash<Library>> =
    LazyLock::new(|| LazyHash::new(Library::default()));

/// Minimal `World` for compiling a single formula: one detached main
/// source plus the embedded font store; nothing else can load.
struct MathWorld {
    library: LazyHash<Library>,
    fonts: &'static FontStore,
    source: Source,
}

impl MathWorld {
    fn new(text: String) -> Self {
        MathWorld {
            library: LIBRARY.clone(),
            fonts: &FONTS,
            source: Source::detached(text),
        }
    }
}

impl World for MathWorld {
    fn library(&self) -> &LazyHash<Library> {
        &self.library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        self.fonts.book()
    }

    fn main(&self) -> FileId {
        self.source.id()
    }

    fn source(&self, id: FileId) -> Result<Source, FileError> {
        if id == self.source.id() {
            Ok(self.source.clone())
        } else {
            Err(FileError::NotFound(PathBuf::from(
                id.vpath().get_without_slash(),
            )))
        }
    }

    fn file(&self, id: FileId) -> Result<Bytes, FileError> {
        if id == self.source.id() {
            Ok(Bytes::from_string(self.source.text().to_string()))
        } else {
            Err(FileError::NotFound(PathBuf::from(
                id.vpath().get_without_slash(),
            )))
        }
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.font(index)
    }

    fn today(&self, _offset: Option<Duration>) -> Option<Datetime> {
        None
    }
}

/// Wrap the converted formula in a paged document and return the SVG of
/// the first page.
fn typeset_svg(tex: &str, display: bool) -> Result<String, String> {
    let body = latex_to_typst(tex);
    let source = format!(
        "#set page(width: auto, height: auto, margin: 0.3em)\n\
         #set text(font: \"New Computer Modern\")\n\
         {display}$ {body} $",
        display = if display { "#align(center)" } else { "" },
    );
    let world = MathWorld::new(source);
    let warned = typst::compile::<typst_layout::PagedDocument>(&world);
    let document = warned
        .output
        .map_err(|errors| {
            errors
                .iter()
                .map(|e| e.message.to_string())
                .collect::<Vec<_>>()
                .join("; ")
        })?;
    let page = document
        .pages()
        .first()
        .ok_or_else(|| "empty document".to_string())?;
    Ok(typst_svg::svg(page, &SvgOptions::default()))
}

/// Raster cache: (tex, display, scale bucket) -> gpu image.
static CACHE: LazyLock<Mutex<HashMap<(String, bool, u32), Arc<RenderImage>>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

/// Extension-prop reader for `logseq-katex` nodes.
fn prop<'a>(node: &'a NodeSnapshot, name: &str) -> Option<&'a Value> {
    node.extension_props.get(name)
}

fn tex_of(node: &NodeSnapshot) -> String {
    prop(node, "tex")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

fn is_display(node: &NodeSnapshot) -> bool {
    prop(node, "display").and_then(Value::as_bool).unwrap_or(false)
}

/// `dom_event`-style event check for the element.
pub fn render(
    _view: &mut LuiNodeView,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    let tex = tex_of(node);
    let display = is_display(node);
    element(&tex, display, node, window, cx)
}

/// A `logseq-<tag>` element whose `style-class` names `latex` (block) or
/// `latex-inline` renders through the same pipeline — this is the shape
/// the generic-dom emitters produce today.
pub fn is_latex_slot(node: &NodeSnapshot) -> bool {
    let NodeIdentity::Extension { identifier, .. } = &node.identity else {
        return false;
    };
    if !matches!(identifier.as_str(), "logseq-div" | "logseq-span") {
        return false;
    }
    let classes = node.extension_string_prop("style-class").unwrap_or("");
    classes
        .split_whitespace()
        .any(|c| c == "latex" || c == "latex-inline")
}

/// Raw tex of a generic-dom slot: the `.opacity-0` holder child carries
/// the source in its `text` prop; fall back to the node's own `text`.
fn slot_tex(view: &LuiNodeView, node: &NodeSnapshot) -> String {
    for child_id in &node.children {
        let shared = view.shared.borrow();
        let Some(child) = shared.store.node(*child_id) else {
            continue;
        };
        let class = child
            .extension_props
            .get("style-class")
            .and_then(Value::as_str)
            .unwrap_or("");
        let text = child
            .extension_props
            .get("text")
            .and_then(Value::as_str)
            .unwrap_or("");
        if class.split_whitespace().any(|c| c == "opacity-0") && !text.is_empty() {
            return text.to_string();
        }
        if !text.is_empty() {
            return text.to_string();
        }
    }
    node.extension_string_prop("text")
        .unwrap_or("")
        .to_string()
}

pub fn render_slot(
    view: &mut LuiNodeView,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    let tex = slot_tex(view, node);
    let classes = node.extension_string_prop("style-class").unwrap_or("");
    let display = classes.split_whitespace().any(|c| c == "latex");
    element(&tex, display, node, window, cx)
}

fn element(
    tex: &str,
    display: bool,
    node: &NodeSnapshot,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> AnyElement {
    let image = rendered_image(tex, display, window, cx);
    let mut element = div();
    if display {
        element = element.w_full().flex().justify_center();
    }
    element = match image {
        Ok(image) => element.child(img(ImageSource::Render(image))),
        Err(_) => element
            .px_1()
            .text_color(cx.theme().muted_foreground)
            .italic()
            .child(SharedString::from(tex.to_string())),
    };
    style::all(element, node).into_any_element()
}

/// Compile + rasterize one formula (or fetch it from the cache). Errors
/// reach the caller so the slot can degrade to the raw tex text.
fn rendered_image(
    tex: &str,
    display: bool,
    window: &mut Window,
    cx: &mut Context<LuiNodeView>,
) -> Result<Arc<RenderImage>, String> {
    if tex.is_empty() {
        return Err("empty tex".to_string());
    }
    let scale = window.scale_factor();
    let key = (tex.to_string(), display, (scale * 4.).round() as u32);
    if let Some(image) = CACHE.lock().ok().and_then(|c| c.get(&key).cloned()) {
        return Ok(image);
    }
    let svg = typeset_svg(tex, display)?;
    let parsed = cx
        .svg_renderer()
        .parse_svg(svg.as_bytes())
        .map_err(|e| e.to_string())?;
    let image = cx
        .svg_renderer()
        .render_parsed(&parsed, SvgSize::ScaleFactor(scale))
        .map_err(|e| e.to_string())?;
    if let Ok(mut cache) = CACHE.lock() {
        cache.insert(key, image.clone());
    }
    Ok(image)
}

// ---------------------------------------------------------------------------
// LaTeX -> typst math translation (documented subset).
//
// Handled:
//   - $...$, $$...$$, \(...\), \[...\] wrappers
//   - \frac/\dfrac/\tfrac/\binom, \sqrt[n], super/subscripts (x^{..} -> x^(..))
//   - \left..\right pairs -> lr(..) blocks
//   - matrix/pmatrix/bmatrix/vmatrix/cases/aligned environments -> mat()/cases()
//   - \text/\mathrm/\operatorname/\textbf -> quoted text / op()/bold()
//   - \mathbb{R|N|Z|Q|C} -> RR/NN/ZZ/QQ/CC, \mathbf -> bold(), \mathcal -> cal(),
//     \mathfrak -> frak(), \mathtt -> mono(), \mathsf -> sans()
//   - accents: \hat \tilde \vec \bar \dot \ddot \breve \check \overline
//     \underline \overbrace \underbrace
//   - spacing \; \: \, \  \quad \qquad ~, \% \$ \& \# \_ \{ \}
//   - color commands (\color \textcolor) drop the color, keep the body
//   - layout noise (\displaystyle \limits \nonumber \label \tag \kern \mkern
//     \phantom \smash \operatorname*) is stripped
//   - the common symbol vocabulary (greek letters pass through under the
//     same name; symbol table below covers the differing names)
//
// Not handled (falls back to raw tex via compile failure or visible drift):
//   - mhchem (\ce, \pu), \boxed, \dfrac with unbraced arg patterns beyond
//     the single-char form, \newcommand macros, multi-column \substack,
//     \xrightarrow/\xleftarrow with content, tikz / AMS-specific packages.
// ---------------------------------------------------------------------------

struct Parser {
    src: Vec<char>,
    pos: usize,
    /// `lr(` blocks opened by `\left`; `\right` pops at this depth.
    lr_depth: usize,
    /// Environment close separators: `mat` uses `;` per `\\`, `cases` `,`.
    env_row_sep: Vec<&'static str>,
}

impl Parser {
    fn new(src: &str) -> Self {
        Parser {
            src: src.chars().collect(),
            pos: 0,
            lr_depth: 0,
            env_row_sep: Vec::new(),
        }
    }

    fn peek(&self) -> Option<char> {
        self.src.get(self.pos).copied()
    }


    fn next(&mut self) -> Option<char> {
        let c = self.peek()?;
        self.pos += 1;
        Some(c)
    }

    /// Consume `text` verbatim if it follows at the cursor.
    fn eat(&mut self, text: &str) -> bool {
        let chars: Vec<char> = text.chars().collect();
        if self.src[self.pos..].starts_with(&chars) {
            self.pos += chars.len();
            true
        } else {
            false
        }
    }

    /// A `\name` command word (may be a single non-letter char).
    fn command_name(&mut self) -> String {
        match self.next() {
            Some(c) if c.is_ascii_alphabetic() || c == '@' => {
                let mut name = c.to_string();
                while matches!(self.peek(), Some(c) if c.is_ascii_alphabetic() || c == '@') {
                    name.push(self.next().unwrap());
                }
                name
            }
            Some(c) => c.to_string(),
            None => String::new(),
        }
    }

    /// One argument: `{..}` group, `\cmd`, or a single char.
    fn arg(&mut self, out: &mut String) {
        while matches!(self.peek(), Some(' ')) {
            self.pos += 1;
        }
        match self.peek() {
            Some('{') => {
                self.pos += 1;
                self.body(out, '}');
            }
            Some('\\') => {
                self.pos += 1;
                self.command(out);
            }
            Some(c) => {
                self.pos += 1;
                out.push(c);
            }
            None => {}
        }
    }

    /// `{..}` group contents without delimiters.
    fn group(&mut self) -> String {
        let mut inner = String::new();
        while matches!(self.peek(), Some(' ')) {
            self.pos += 1;
        }
        if self.eat("{") {
            self.body(&mut inner, '}');
        }
        inner
    }

    /// An optional `[..]` argument, contents raw.
    fn opt_bracket(&mut self) -> Option<String> {
        let mut i = self.pos;
        while matches!(self.src.get(i), Some(' ')) {
            i += 1;
        }
        if self.src.get(i) != Some(&'[') {
            return None;
        }
        self.pos = i + 1;
        let mut depth = 1;
        let mut inner = String::new();
        while let Some(c) = self.next() {
            match c {
                '[' => depth += 1,
                ']' => {
                    depth -= 1;
                    if depth == 0 {
                        return Some(inner);
                    }
                }
                _ => {}
            }
            inner.push(c);
        }
        Some(inner)
    }

    /// A `\left`/`\right` delimiter token -> typst delimiter name.
    fn delimiter(&mut self) -> String {
        match self.peek() {
            Some('\\') => {
                self.pos += 1;
                let name = self.command_name();
                match name.as_str() {
                    "lbrace" | "{" => "brace.l".to_string(),
                    "rbrace" | "}" => "brace.r".to_string(),
                    "lvert" | "|" => "bar".to_string(),
                    "Vert" | "lVert" => "bar.double".to_string(),
                    "langle" => "angle.l".to_string(),
                    "rangle" => "angle.r".to_string(),
                    "lfloor" => "floor.l".to_string(),
                    "rfloor" => "floor.r".to_string(),
                    "lceil" => "ceil.l".to_string(),
                    "rceil" => "ceil.r".to_string(),
                    "." => "none".to_string(),
                    other => other.to_string(),
                }
            }
            Some(c) => {
                self.pos += 1;
                match c {
                    '|' => "bar".to_string(),
                    '{' => "brace.l".to_string(),
                    '}' => "brace.r".to_string(),
                    '.' => "none".to_string(),
                    '<' => "angle.l".to_string(),
                    '>' => "angle.r".to_string(),
                    other => other.to_string(),
                }
            }
            None => "none".to_string(),
        }
    }

    fn command(&mut self, out: &mut String) {
        let name = self.command_name();
        match name.as_str() {
            // -- two-argument fractions and binomials ---------------------
            "frac" | "dfrac" | "tfrac" | "cfrac" => {
                out.push_str("frac(");
                self.arg(out);
                out.push_str(", ");
                self.arg(out);
                out.push(')');
            }
            "binom" | "dbinom" | "tbinom" => {
                out.push_str("binom(");
                self.arg(out);
                out.push_str(", ");
                self.arg(out);
                out.push(')');
            }
            "sqrt" => {
                if let Some(order) = self.opt_bracket() {
                    out.push_str("root(");
                    out.push_str(&order);
                    out.push_str(", ");
                    self.arg(out);
                    out.push(')');
                } else {
                    out.push_str("sqrt(");
                    self.arg(out);
                    out.push(')');
                }
            }
            // -- \left..\right -> lr(..) ----------------------------------
            "left" => {
                let open = self.delimiter();
                out.push_str("lr(");
                out.push_str(&open);
                self.lr_depth += 1;
            }
            "right" => {
                let close = self.delimiter();
                if self.lr_depth > 0 {
                    out.push_str(", ");
                    out.push_str(&close);
                    out.push(')');
                    self.lr_depth -= 1;
                } else {
                    out.push_str(&close);
                }
            }
            "middle" => {
                let mid = self.delimiter();
                out.push_str(&mid);
            }
            // -- environments ---------------------------------------------
            "begin" | "end" => {
                let env = self.group();
                let is_begin = name == "begin";
                let (open, sep, close) = match env.as_str() {
                    "matrix" => ("mat(", ";", ")"),
                    "pmatrix" => ("mat(delim: \"(\", ", ";", ")"),
                    "bmatrix" => ("mat(delim: \"[\", ", ";", ")"),
                    "Bmatrix" => ("mat(delim: \"{\", ", ";", ")"),
                    "vmatrix" => ("mat(delim: \"|\", ", ";", ")"),
                    "Vmatrix" => ("mat(delim: \"||\", ", ";", ")"),
                    "smallmatrix" => ("mat(delim: \"(\", ", ";", ")"),
                    "cases" => ("cases(", ",", ")"),
                    "aligned" | "align" | "align*" | "gathered" | "gather"
                    | "gather*" | "eqnarray" | "eqnarray*" | "subarray" => {
                        ("mat(", ";", ")")
                    }
                    // Unknown env: emit contents only.
                    _ => ("(", ";", ")"),
                };
                if is_begin {
                    out.push_str(open);
                    self.env_row_sep.push(sep);
                } else {
                    if out.ends_with(' ') {
                        out.pop();
                    }
                    out.push_str(close);
                    self.env_row_sep.pop();
                }
            }
            // -- text-ish wrappers ----------------------------------------
            "text" | "textnormal" | "textrm" | "textsf" | "texttt" | "mathrm"
            | "mathnormal" => {
                let body = self.group();
                out.push('"');
                out.push_str(&body.replace('\\', "\\\\").replace('"', "\\\""));
                out.push('"');
            }
            "operatorname" => {
                let _star = self.eat("*");
                let body = self.group();
                out.push_str("op(\"");
                out.push_str(&body.replace('\\', "\\\\").replace('"', "\\\""));
                out.push_str("\")");
            }
            "mathbb" => {
                let body = self.group();
                let mapped = match body.trim() {
                    "R" => "RR",
                    "N" => "NN",
                    "Z" => "ZZ",
                    "Q" => "QQ",
                    "C" => "CC",
                    "H" => "HH",
                    "P" => "PP",
                    "K" => "KK",
                    _ => "",
                };
                if mapped.is_empty() {
                    out.push_str("upright(");
                    out.push_str(&body);
                    out.push(')');
                } else {
                    out.push_str(mapped);
                }
            }
            "mathbf" | "textbf" => {
                out.push_str("bold(");
                self.arg(out);
                out.push(')');
            }
            "mathcal" | "mathscr" => {
                out.push_str("cal(");
                self.arg(out);
                out.push(')');
            }
            "mathfrak" => {
                out.push_str("frak(");
                self.arg(out);
                out.push(')');
            }
            "mathsf" => {
                out.push_str("sans(");
                self.arg(out);
                out.push(')');
            }
            "mathtt" => {
                out.push_str("mono(");
                self.arg(out);
                out.push(')');
            }
            "mathit" | "mit" => {
                out.push_str("italic(");
                self.arg(out);
                out.push(')');
            }
            // -- accents ---------------------------------------------------
            "hat" | "widehat" => self.fn1(out, "hat"),
            "tilde" | "widetilde" => self.fn1(out, "tilde"),
            "vec" | "overrightarrow" => self.fn1(out, "arrow"),
            "bar" | "overbar" => self.fn1(out, "macron"),
            "dot" => self.fn1(out, "dot"),
            "ddot" => self.fn1(out, "ddot"),
            "breve" => self.fn1(out, "breve"),
            "check" => self.fn1(out, "check"),
            "overline" => self.fn1(out, "overline"),
            "underline" => self.fn1(out, "underline"),
            "overbrace" => self.fn1(out, "overbrace"),
            "underbrace" => self.fn1(out, "underbrace"),
            "cancel" | "bcancel" | "xcancel" => self.fn1(out, "cancel"),
            "boxed" => self.fn1(out, "box"),
            "pmod" => {
                out.push_str("op(\"mod\") (");
                self.arg(out);
                out.push(')');
            }
            // -- color: drop the color, keep the body ---------------------
            "color" => {
                // `\color{c}` colors the rest of the group: drop the
                // command only and keep scanning.
                let _color = self.group();
            }
            "textcolor" => {
                let _color = self.group();
                self.arg(out);
            }
            "colorbox" | "fcolorbox" => {
                let _color = self.group();
                self.arg(out);
            }
            // -- spacing ---------------------------------------------------
            ";" | ":" => out.push_str("space.third "),
            "," => out.push_str("space.hair "),
            " " => out.push_str("space.quad "),
            "!" => out.push_str("space.neg "),
            "quad" => out.push_str("space.quad "),
            "qquad" => out.push_str("space.em "),
            "enspace" => out.push_str("space.en "),
            "hspace" | "hskip" => {
                let _width = self.group();
                out.push_str("space.quad ");
            }
            // -- stripped layout commands ----------------------------------
            "displaystyle" | "textstyle" | "scriptstyle" | "scriptscriptstyle"
            | "limits" | "nolimits" | "nonumber" | "relax" | "vphantom"
            | "hphantom" | "smash" | "strut" | "hfil" | "hfill" => {
                if matches!(name.as_str(), "smash" | "strut" | "vphantom" | "hphantom") {
                    let _ = self.group();
                }
            }
            "label" | "tag" | "ref" | "eqref" => {
                let _ = self.group();
            }
            "kern" | "mkern" | "mskip" | "hspace*" => {
                let _ = self.group();
            }
            "rule" => {
                let _ = self.group();
                let _ = self.group();
            }
            "mathop" | "mathbin" | "mathrel" | "mathord" | "mathopen"
            | "mathclose" | "mathpunct" | "mathinner" | "ensuremath" => {
                self.arg(out);
            }
            // -- sizing prefixes -------------------------------------------
            "big" | "Big" | "bigg" | "Bigg" | "bigl" | "Bigl" | "biggl"
            | "Biggl" | "bigr" | "Bigr" | "biggr" | "Biggr" | "bigm"
            | "Bigm" | "biggm" | "Biggm" => {
                let delim = self.delimiter();
                out.push_str(&delim);
            }
            "mod" | "bmod" => out.push_str("op(\"mod\") "),
            // -- escaped characters ----------------------------------------
            "{" => out.push_str("brace.l"),
            "}" => out.push_str("brace.r"),
            "%" => out.push_str("\"%\""),
            "$" => out.push_str("\"$\""),
            "&" => out.push_str("\"&\""),
            "#" => out.push_str("\"#\""),
            "_" => out.push_str("\"_\""),
            "\\" => {
                // Line break: mat rows use `;`, case rows use `,`.
                let sep = self.env_row_sep.last().copied().unwrap_or(",");
                if out.ends_with(' ') {
                    out.pop();
                }
                out.push_str(sep);
                out.push(' ');
            }
            // -- symbols ----------------------------------------------------
            other => out.push_str(symbol(other)),
        }
    }

    fn fn1(&mut self, out: &mut String, name: &str) {
        out.push_str(name);
        out.push('(');
        self.arg(out);
        out.push(')');
    }

    /// Emit one `^`/`_` group: `x^{abc}` -> `x^(abc)`, `x^\alpha` stays.
    fn script(&mut self, out: &mut String, kind: char) {
        out.push(kind);
        match self.peek() {
            Some('{') => {
                self.pos += 1;
                out.push('(');
                self.body(out, '}');
                out.push(')');
            }
            _ => self.arg(out),
        }
    }

    /// Scan until `end` (exclusive), converting each token.
    fn body(&mut self, out: &mut String, end: char) {
        while let Some(c) = self.peek() {
            if c == end {
                self.pos += 1;
                return;
            }
            match c {
                '\\' => {
                    self.pos += 1;
                    self.command(out);
                }
                '{' => {
                    self.pos += 1;
                    out.push('(');
                    self.body(out, '}');
                    out.push(')');
                }
                '^' | '_' => {
                    self.pos += 1;
                    self.script(out, c);
                }
                '&' => {
                    self.pos += 1;
                    // Cell separator: swallow the padding space before it.
                    if out.ends_with(' ') {
                        out.pop();
                    }
                    out.push_str(", ");
                }
                '~' => {
                    self.pos += 1;
                    out.push_str("space.med ");
                }
                '%' => {
                    while let Some(c) = self.next() {
                        if c == '\n' {
                            break;
                        }
                    }
                }
                '$' => {
                    self.pos += 1;
                }
                ' ' if out.ends_with(' ')
                    || out.ends_with(',')
                    || out.ends_with('(') =>
                {
                    self.pos += 1;
                }
                _ => {
                    self.pos += 1;
                    out.push(c);
                }
            }
        }
    }
}

/// Commands whose typst name differs from the latex spelling, or that need
/// a non-alphabetic escape. Greek and single-word symbols mostly pass
/// through by identity (`\alpha` -> `alpha`).
fn symbol<'a>(name: &'a str) -> &'a str {
    match name {
        "pm" => "plus.minus",
        "mp" => "minus.plus",
        "le" | "leq" | "leqslant" | "leqq" => "<=",
        "ge" | "geq" | "geqslant" | "geqq" => ">=",
        "ne" | "neq" => "!=",
        "ll" | "lll" => "<<",
        "gg" | "ggg" => ">>",
        "approx" => "approx",
        "equiv" => "equiv",
        "cong" => "tilde.equiv",
        "simeq" => "tilde.eq",
        "sim" => "tilde.op",
        "propto" => "prop",
        "asymp" => "asymp",
        "doteq" => "dot(eq)",
        "times" => "times",
        "div" => "div",
        "cdot" | "cdotp" | "centerdot" => "dot.op",
        "ast" => "ast.op",
        "star" => "star.op",
        "circ" => "compose",
        "bullet" => "bullet",
        "oplus" => "plus.circle",
        "ominus" => "minus.circle",
        "otimes" => "times.circle",
        "odot" => "dot.circle",
        "oslash" => "cancel.circle",
        "infty" => "infinity",
        "partial" => "diff",
        "nabla" => "nabla",
        "hbar" => "planck.reduce",
        "ell" => "ell",
        "aleph" => "alef",
        "Re" => "Re",
        "Im" => "Im",
        "wp" => "wp",
        "forall" => "forall",
        "exists" => "exists",
        "nexists" => "exists.not",
        "emptyset" | "varnothing" => "emptyset",
        "in" => "in",
        "notin" => "in.not",
        "ni" => "in.rev",
        "subset" => "subset",
        "supset" => "supset",
        "subseteq" => "subset.eq",
        "supseteq" => "supset.eq",
        "nsubseteq" => "subset.eq.not",
        "nsupseteq" => "supset.eq.not",
        "subsetneq" => "subset.neq",
        "supsetneq" => "supset.neq",
        "sqsubseteq" => "subset.sq",
        "sqsupseteq" => "supset.sq",
        "cup" | "bigcup" => "union",
        "cap" | "bigcap" => "sect",
        "sqcup" | "bigsqcup" => "union.sq",
        "setminus" | "smallsetminus" => "without",
        "uplus" | "biguplus" => "union.plus",
        "vee" | "lor" | "bigvee" => "or",
        "wedge" | "land" | "bigwedge" => "and",
        "neg" | "lnot" => "not",
        "top" => "top",
        "bot" => "bot",
        "vdash" => "tack.r",
        "dashv" => "tack.l",
        "models" => "models",
        "mid" => "divides",
        "nmid" => "divides.not",
        "parallel" => "parallel",
        "nparallel" => "parallel.not",
        "perp" => "perp",
        "angle" => "angle",
        "measuredangle" => "angle.measured",
        "sphericalangle" => "angle.spheric",
        "prime" => "'",
        "dagger" => "dagger",
        "ddagger" | "ddag" => "dagger.double",
        "to" | "rightarrow" | "gets" => "arrow.r",
        "leftarrow" => "arrow.l",
        "leftrightarrow" => "arrow.l.r",
        "Rightarrow" => "arrow.r.double",
        "Leftarrow" => "arrow.l.double",
        "Leftrightarrow" => "arrow.l.r.double",
        "mapsto" => "arrow.r.bar",
        "hookrightarrow" => "arrow.r.hook",
        "hookleftarrow" => "arrow.l.hook",
        "longrightarrow" => "arrow.r.long",
        "longleftarrow" => "arrow.l.long",
        "Longrightarrow" => "arrow.r.double.long",
        "Longleftarrow" => "arrow.l.double.long",
        "uparrow" => "arrow.t",
        "downarrow" => "arrow.b",
        "updownarrow" => "arrow.t.b",
        "Uparrow" => "arrow.t.double",
        "Downarrow" => "arrow.b.double",
        "xrightarrow" => "arrow.r.long",
        "xleftarrow" => "arrow.l.long",
        "implies" => "arrow.r.double",
        "ldots" | "dots" | "cdots" => "dots.h.c",
        "vdots" => "dots.v",
        "ddots" => "dots.down",
        "degree" => "degree",
        "checkmark" => "checkmark",
        "blacksquare" | "qed" => "qed",
        "square" => "square.stroked.medium",
        "Diamond" => "diamond.stroked.medium",
        "diamondsuit" => "suit.diamond",
        "clubsuit" => "suit.club",
        "spadesuit" => "suit.spade",
        "heartsuit" => "suit.heart",
        "surd" => "sqrt",
        "slash" => "slash",
        "backslash" => "backslash",
        "ltimes" => "times.l",
        "rtimes" => "times.r",
        "bowtie" => "bowtie",
        "O" | "o" => "o.slash",
        "AA" | "aa" => "circle(A)",
        "L" | "l" => "l.stroked",
        "S" => "section",
        "P" => "pilcrow",
        "copyright" => "copyright",
        "eth" => "eth",
        "imath" => "dotless.i",
        "jmath" => "dotless.j",
        "vartheta" => "theta.alt",
        "varpi" => "pi.alt",
        "varrho" => "rho.alt",
        "varsigma" => "sigma.alt",
        "varphi" | "phi" => "phi.alt",
        "varepsilon" | "epsilon" => "epsilon",
        "varkappa" => "kappa.alt",
        "int" | "intop" => "integral",
        "iint" | "iintop" => "integral.double",
        "iiint" => "integral.triple",
        "oint" | "oiiint" => "integral.cont",
        "bigodot" => "times.circle",
        "bigoplus" => "plus.circle",
        "bigotimes" => "times.circle",
        "bigodotbig" => "times.circle",
        "liminf" => "liminf",
        "limsup" => "limsup",
        // Everything else passes through by identity — latex and typst
        // share the spelling for the majority of commands (`alpha`, `sum`,
        // `integral`, `sin`, `lim`, `approx`, ...). A genuinely unknown
        // identifier makes the typst compile fail and the slot degrades
        // to the raw tex text.
        _ => name,
    }
}

/// strip $...$ / $$...$$ / \(...\) / \[...\] wrappers, translate.
pub fn latex_to_typst(tex: &str) -> String {
    let trimmed = tex.trim();
    let inner = if trimmed.starts_with("$$") && trimmed.ends_with("$$") && trimmed.len() >= 4 {
        &trimmed[2..trimmed.len() - 2]
    } else if trimmed.starts_with("\\(") && trimmed.ends_with("\\)") {
        &trimmed[2..trimmed.len() - 2]
    } else if trimmed.starts_with("\\[") && trimmed.ends_with("\\]") {
        &trimmed[2..trimmed.len() - 2]
    } else if trimmed.starts_with('$') && trimmed.ends_with('$') && trimmed.len() >= 2 {
        &trimmed[1..trimmed.len() - 1]
    } else {
        trimmed
    };
    let mut parser = Parser::new(inner);
    let mut out = String::new();
    parser.body(&mut out, '\0');
    out
}

#[cfg(test)]
mod tests {
    use super::latex_to_typst;

    #[test]
    fn arithmetic() {
        assert_eq!(latex_to_typst("x^2 + y_i"), "x^2 + y_i");
        assert_eq!(latex_to_typst("$x^{a+b}$"), "x^(a+b)");
        assert_eq!(latex_to_typst("x_{i+1}"), "x_(i+1)");
        assert_eq!(latex_to_typst("x_1"), "x_1");
        assert_eq!(latex_to_typst("x_\\alpha"), "x_alpha");
    }

    #[test]
    fn fractions_and_roots() {
        assert_eq!(latex_to_typst("\\frac{a+b}{c}"), "frac(a+b, c)");
        assert_eq!(latex_to_typst("\\dfrac12"), "frac(1, 2)");
        assert_eq!(latex_to_typst("\\sqrt{x}"), "sqrt(x)");
        assert_eq!(latex_to_typst("\\sqrt[3]{x}"), "root(3, x)");
        assert_eq!(latex_to_typst("\\binom{n}{k}"), "binom(n, k)");
    }

    #[test]
    fn delimiters() {
        assert_eq!(
            latex_to_typst("\\left( x + 1 \\right)"),
            "lr((x + 1 , ))"
        );
        assert_eq!(
            latex_to_typst("\\left\\{ x \\right\\}"),
            "lr(brace.l x , brace.r)"
        );
    }

    #[test]
    fn environments() {
        assert_eq!(
            latex_to_typst("\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}"),
            "mat(delim: \"(\", a, b; c, d)"
        );
        assert_eq!(
            latex_to_typst("\\begin{cases} x \\\\ y \\end{cases}"),
            "cases(x, y)"
        );
    }

    #[test]
    fn text_and_styles() {
        assert_eq!(latex_to_typst("\\text{for all }"), "\"for all \"");
        assert_eq!(latex_to_typst("\\mathbb{R}"), "RR");
        assert_eq!(latex_to_typst("\\mathbb{F}"), "upright(F)");
        assert_eq!(latex_to_typst("\\mathbf{x}"), "bold(x)");
    }

    #[test]
    fn symbols() {
        assert_eq!(latex_to_typst("\\sum_{i=0}^n i"), "sum_(i=0)^n i");
        assert_eq!(latex_to_typst("\\int_0^1 x dx"), "integral_0^1 x dx");
        assert_eq!(latex_to_typst("\\alpha \\leq \\beta"), "alpha <= beta");
        assert_eq!(latex_to_typst("a \\cdot b"), "a dot.op b");
        assert_eq!(latex_to_typst("\\to \\infty"), "arrow.r infinity");
    }

    #[test]
    fn stripped_and_colors() {
        assert_eq!(
            latex_to_typst("\\displaystyle \\frac{a}{b}"),
            " frac(a, b)"
        );
        assert_eq!(latex_to_typst("\\color{red} x"), " x");
    }
}
