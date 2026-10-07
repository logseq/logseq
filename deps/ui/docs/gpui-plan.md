# deps/ui GPUI 版本 — 实施计划

目标：Logseq LUI rewrite (deps/ui) 增加 GPUI host —— OCaml 应用代码完全复用，
Rust + gpui-kit 渲染，功能验收对齐 Electron/web 现有能力。

## 架构

```
┌──────────────────────── Logseq.app (Rust binary) ────────────────────────┐
│  deps/ui/gpui/host/ (Rust crate)                                         │
│  ├─ bridge FFI    lui_ocaml_start(patch_cb, wakeup_cb, platform_req_cb,  │
│  │                platform_code, host_code, payload) — logseq bridge ABI │
│  ├─ dom-op 处理器  set-attr/set-class/set-text/focus/measure-node/…      │
│  ├─ dom-event 发射 click/input/keydown/scroll → lui_ocaml_extension_event│
│  └─ 平台服务      clipboard / open-url / file dialogs / menu / pdf 占位  │
│                                                                          │
│  lui-gpui (logseq/lui, path dep)                                        │
│  ├─ 已有: wire/store/后端/每节点 Entity 最小渲染 + gpui-* 扩展组件        │
│  └─ 新增: dom.rs(logseq-* 标签→布局) + tailwind.rs(style-class 解析)    │
│                                                                          │
│  logseq_ui_gpui (OCaml, native object, 静态链接进 host)                  │
│  └─ deps/ui/gpui/ ≈ deps/ui/native/ 的 dune copy — native twin 全套复用  │
└──────────────────────────────────────────────────────────────────────────┘
```

## 复用策略（web / gpui 共享代码）

1. **OCaml 应用层零拷贝**：Model/Update/View/所有 UI 组件走同一套
   `src/` + `subs/` 源码，platform 差异已由 `native/` 的 native twin 吸收。
2. **deps/ui/gpui 不含独立 .ml 实现**：dune 里 `(copy ../apple/x.ml)` 复用
   native/ 全部 native 文件（platform.ml、host.ml、fetch.ml、daemon_client.ml、
   vdom.ml、dom_ext.ml、imperative_dom.ml、logseq_dom.ml、native_embed.ml、
   logseq_lui_bridge.c…）。gpui/ 目录只有 dune + host/ Rust 代码。
3. **共享文件的两处小改**（对 native 零影响）：
   - `native/logseq_dom.ml`：`schema_of` profiles 加 `gpui_profile`
     `{ MacOS; GPUIHost }`，使 logseq-\* 扩展在 GPUI host 注册。
   - `native/native_embed.ml`：`host_code 6 → Lui_protocol.GPUIHost`。
4. **组件化迁移（架构主轴，见 M2*）**：视图源码从 `dom ~tag ~classes`
   DOM 拼法迁到 `Lui_elements` 组件 kind 拼法（`column ~gap ~p …`）。
   layout/样式走 kind 的类型化 props，`style_class` 保留但语义降级为
   web 专属微调通道 —— Apple/GPUI 忽略 css class，不需要适配。
   `logseq-<tag>` DOM 扩展整体删除；extension 只留给平台特有件
   （editor surface、split/dock、gpui-table 等）。
   - `dom.rs` 收缩为迁移期骨架渲染器（不再追求 class 精度），迁移完成
     后随 logseq-* 扩展一起删除。

## Host 通道面（对 Rust 的完整要求）

OCaml → host（全由 `logseq_lui_bridge` ABI 承载，Rust 全部要实现或显式 stub）：

- `patch_cb`：增量 patch JSON → lui_core store（已有）
- `wakeup_cb`：OCaml 工作线程 → UI 线程泵（`lui_ocaml_pump`）
- `platform_request`：`clipboard` / `open-url` / `ui-state` / `dom-op`
  （dom-op 子命令：set-attr remove-attr set-class class-add/remove
  set-text-content set-value set-selection-range focus measure-node
  scroll-into-view scroll-row-into-view remove style-set-property
  save-file download-text download-binary dump-frames hljs/katex-pending）

host → OCaml：

- `lui_ocaml_platform_event`：`menu-*`、`node-rect`（measure 回包）、
  appearance 等
- `lui_ocaml_extension_event`：`dom-event{name,payload}` — DOM 语义事件
- 标准键鼠/输入事件一组（press/text_changed/submit/…）
- `lui_ocaml_visible_range` / `scroll_completed`：虚拟列表

## 里程碑

- **M1 脚手架**：opam pin 到含 GPUIHost 的 lui main；deps/ui/gpui/dune
  copy 全套；`dune build gpui/native_embed.exe.o` 通过；Rust host crate
  链接 complete-object + OCaml runtime（asmrun/unix/threads/str），
  `lui_ocaml_start(1, 6)` 起空窗口吃下首屏 patch。
- **M2 组件化迁移（views → LUI 组件）**：~2500 处 `dom()` 调用（~90 文件）
  换成 `Lui_elements` kind。映射：div→column/row/box/stack/scroll、
  span/raw-text→text、button→button、a→link、input/option/select→
  input/select、i/svg→icon、kbd→kbd、li/ul→list/list_item、pre/code→
  text(mono)、h2→heading、p/small→paragraph/text、img→image/file_image。
  布局类（flex/gap-/p-/w-/h-/min-/max-）翻成 typed props；`style_class`
  原样保留供 web parity；`~events:"click"`→`~on_press`；`~html`、
  inline `style` attr、`~attrs` JSON 逃逸舱删除；`#ref`/`data-ref`→
  `~accessibility_identifier`。keydown/pointer/hover 等 DOM 特有事件
  无组件等价物 —— 逐个决定：删、用 kind 事件近似、或走平台 extension。
- **M3 dom-op + 测量回路**：set-attr/set-class/set-text/focus/
  measure-node→node-rect/scroll-into-view/remove/set-value/
  set-selection-range；popup 定位依赖 rect 回传，这层通了弹层才可用。
- **M4 编辑体验**：textarea editor（editor-wrapper）、selection-range、
  虚拟列表 visible_range、cmdk、右键菜单。
- **M5 功能全景**：pages/blocks/properties/queries/views/sidebar/
  settings/toasts/dnd/export/import/assets/flashcards/tags。
- **M6 Electron parity 清单**：对照 `docs/e2e-contract.md`（242 项
  clj-e2e 清单）逐项打勾；plugins/pdf/code-mirror 这类"富宿主嵌入"
  单列（gpui 侧用 gpui-component Editor/高亮或 stub 降级，逐项定降级策略）。
- **M7 e2e 设施**：见下。

## 测试方案

1. **OCaml 层（无需 Rust）**：`deps/ui/test/drive.ml` 已有 in-process
   Drive —— recording backend 重放 patch + `Lui_app.dispatch_event`
   注入事件 + Stub_dom/Fake_worker。gpui 版把 drive 测试编进 native
   target（native twin 已提供全部 browser-global shim），断言
   patch 流结构 —— 这套测试 web/gpui/apple 三方共用。
2. **Rust 层单测**：`cargo test` —
   - `tailwind.rs`：class → Styled 映射表快照测试
   - `dom.rs`：patch JSON → 节点树结构断言
   - `lui_ocaml_*` ABI：起 TestAppContext 不依赖 GUI
3. **GPUI headless e2e（gpui-pre 0.3.8 自带）**：
   `TestAppContext` + `add_window_view` → `VisualTestContext`：
   `simulate_keystrokes` / `simulate_input` / `simulate_click(point)` /
   `simulate_mouse_*` / `draw()` / `dispatch_action` / `run_until_parked`。
   TestWindow/TestDispatcher 全 headless，CI 可跑无屏。
   e2e 场景 = 脚本化 JSON：注入 patch（或起真 OCaml lib）→
   simulate 输入 → 断言 OCaml 收到的事件 / patch 流变化 /
   元素 bounds。覆盖事件回流、dom-op、measure-node 回路。
4. **冒烟真机**：`cargo run` 起窗口，testing agent 逐 section
   截图核对 + 录屏（沿用 lui-gpui-demo-testing 流程）。

## 工作量与并行

Subagent 划分（相互独立文件面）：

| 子任务 | 仓库 | 内容 |
|---|---|---|
| A | logseq | deps/ui/gpui dune + 共享文件小改 + native_embed.o 编通 |
| B | lui | tailwind.rs 解析器（含 cp__/ls- 字典） |
| C | lui | dom.rs 标签渲染器 + dom-event/dom-op 回路 |
| D | logseq | Rust host crate：FFI + 平台服务 + dom-op 分发 |
| E | logseq | native drive 测试移植 + e2e 场景脚本 |

M1 (A) 先行解锁 B–E 并行；C 依赖 B 的解析器接口。

## 风险

- **style-class 覆盖度**：已解决 —— 组件化后 native 不解析 class；
  web 端 class 原样透传（melange kind 渲染器已支持 style_class），
  parity 由 CSS 侧保证，host 零适配。
- **measure-node 回路**：dom-op 是同步通道但 rect 异步回 —— Rust
  端 prepaint 后回填 bounds，沿用已有 Rc<Cell>+notify 模式。
- **CodeMirror/pdf/plugins**：富宿主嵌入最重 —— M6 逐项定策略
  （gpui-component Editor / 内嵌 WebView / 降级只读）。
- **性能**：virtual list 依赖 visible_range 协议已在 wire 层，
  渲染粒度已是 per-node entity —— 主要风险是 tailwind 解析热路径，
  class 字符串缓存 key 即可。
