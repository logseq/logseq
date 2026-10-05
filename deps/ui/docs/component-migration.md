# deps/ui 视图组件化迁移规范

目标：视图代码全部改用 `Lui_elements` 组件 kind + 类型化 props，
`dom`/`logseq-<tag>` DOM 扩展层整体删除。web 靠 `style_class` 保持
像素级 parity；Apple/GPUI 忽略 class，按 kind + typed props 渲染
原生组件。extension 只保留平台特有件（editor surface、split/dock、
gpui-table、pdf/media）。

## tag → kind 映射

| `~tag` (dom) | LUI kind | 说明 |
|---|---|---|
| `div` + `flex` | `row` | 横向 |
| `div` + `flex flex-col` | `column` | 纵向 |
| `div` + `flex-wrap` | `row`/`column` + `~columns` | 换行用 columns |
| `div` + `grid` | `grid`/`columns` | |
| `div` 纯容器 | `box` | 无语义容器 |
| `div` + overflow-*-scroll | `scroll` | `~orientation` |
| `div` 绝对定位/层叠 | `stack`/`overlay`/`edge_inset` | |
| `span`/`raw-text`/`strong`/`sup`/`small`/`code`/`p`/`pre` | `text`/`paragraph`/`heading` | `~value`/`~text` |
| `button` | `button` | `~text`/`~variant`/`~disabled`/`~on_press` |
| `a` | `link` | `~url`/`~text` |
| `input[type=text/search]` | `input`/`text_field`/`search_field` | `~placeholder`/`~text`/`~on_input`/`~on_submit` |
| `input[type=checkbox]` | `checkbox` | `~checked`/`~on_toggle` |
| `input[type=radio]` | `radio`/`radio_group` | |
| `textarea` | `textarea` | |
| `select`/`option` | `select` + `menu_item` | |
| `i`(ti-*)/`svg`(tabler) | `icon` | `~name:(`app "…")` + app_icons 注册 |
| `kbd` | `kbd` | |
| `img` | `image`/`file_image` | `~image`/`~source` |
| `ul`/`li` | `list`/`list_item` | |
| `hr`/`divider` | `divider` | `~orientation` |

## 类 → typed props

布局/结构走 typed props 唯一通道；`~style_class` 只留 app 语义类
（ui__toast、cp__* 这类 stylesheet 真有规则的）。utility 类
（flex/gap-2/p-3/w-full/text-sm…）迁移时删除不保留 —— web 后端
会把 typed props 应用成真实样式（gap/padding/width/flex/align
都落在 DOM style 上），native 同样靠它们排版：

| class 前缀 | typed prop |
|---|---|
| `gap-N` `gap-x-N` `gap-y-N` | `~gap` |
| `p-N px-N py-N` | `~padding`/`~padding_horizontal`/`~padding_vertical` |
| `w-full h-full flex-1` | cross 轴默认 stretch 不写；主轴占满 `~grow:1.` |
| `w-N h-N min-w-*/max-w-*` | `~width`/`~height`/`~min_width`/`~max_width` 等（int pt） |
| `items-*` | `~cross`（`items-center`→`` `center ``） |
| `justify-*` | `~main`（`justify-between`→`` `space_between ``） |
| 纯装饰类（颜色/圆角/字号…） | 删 —— native 用 theme 默认；web 如需保留外观，进 stylesheet 语义类 |

值取整数 pt。拿不准的先不翻，只留 style_class。

## reactive 约定

值/文本/class 的变化用 `~*_signal` reactive props（ppx 写法
`~p:(reactive f s)`），不用 `dyn` 整体重挂。`dyn`/`if_`/`keyed`
只用于结构性分支（列表增删、显隐切换、互斥面板）。共享 `own`
信号托管逻辑不变。

## 事件映射

| dom 写法 | LUI 写法 |
|---|---|
| `~events:"click" ~on_dom_event:(fun n _ -> if n="click" then f ())` | `~on_press:(fun _ -> f ())` |
| `~events:"contextmenu"` | `context_menu` kind 或删（平台行为） |
| `~events:"change input"` on input | `~on_input`/`~on_toggle` |
| `~events:"keydown submit"` | `~on_submit`；raw keydown 无等价物 |
| mouseover/mouseout/pointer* | 删除（DOM 特有，无跨平台等价物） |
| 容器上的 click | `Ui.pressable ~on_press …`（见下） |

容器 kind（row/column/box/scroll/stack）没有 `~on_press` 参数 —
用 `Ui_parts.pressable` combinator 包一层：

```ocaml
Ui_parts.pressable ~on_press:(fun _ -> f ()) (row ~key ~style_class:cls children)
```

## 其余约定

- `~key` 原样保留；`~id`/`data-ref`/`#ref` → `~accessibility_identifier`
- "render nothing" → `spacer ~key:"…" []`（anchor 节点）；条件挂载用 `if_ ~test`
- **结构分支优先普通 OCaml `if`/`List.map`** —— `if_`/`keyed`/`dyn`
  只在分支条件/列表成员挂在 signal 上（需要随 signal 重发结构）时用；
  条件静态或只需初始化时求值的直接写普通 `if`/条件拼 list，更直白
- `fragment` 用法不变（Logseq_dom 的 own/信号托管
  暂时保留 —— 其内部实现会随 dom() 删除一起改造，call site 不用管）
- `~text` → `text ~value:"…"`；`~html` → children 元素
- `aria-label` → `~label`（button 等 kind 的 a11y 名称参数）
- icon 的 `~icon`/button 内嵌图标：`button ~icon:`x` ~icon_placement:`leading`

## attrs 映射 / 删除

| attr | 去向 |
|---|---|
| `aria-label` `aria-*` | `~accessibility_label` / `~accessibility_identifier` |
| `id` `data-testid` `data-ref` `#ref` | `~accessibility_identifier`（或 `~key`） |
| `placeholder` `value` `checked` `href` `target` `src` `type` `autofocus` `name` `for` `autocomplete` `title` | 对应 kind 的 typed props |
| `tabindex` `role` | kind 语义自带 → 删 |
| `style` inline CSS | 删 —— 翻成 typed props 或进 stylesheet 类 |
| `data-*` app 标记 | `~accessibility_identifier` 或删 |
| `~html` | 删 —— 改成元素 children（逐个改写） |
| `draggable` | dnd 由 `swipe_actions`/平台机制接管 → 删 |

## icons

`Icons.raw`/`Icons.font`/`dom ~tag:"i"`/`dom ~tag:"svg"` →
`icon ~name:<icon>`，name 规则：

- 名字在 `Lui_elements.icon` 内置集合（x/check/search/settings/
  chevron-*…45 个）→ `~name:`x` 直接用内置
- 其余 tabler 名 → `~name:(`app "<tabler-name>")`：`app:` 前缀走
  app 图标注册表 —— web 端 `Lui_web.create_with_extensions` 的
  app_icons map（`Icons.app_icons ()` 由 icon_tabler_data 生成
  svg data URI）；GPUI 端 Rust host include 同一份
  tabler-children.json；Swift 端 tabler ttf/svg 资源
- `ti ti-*` 字体类**删掉**：icon kind 自带 svg/mask 渲染，字体
  glyph 会被 mask 双重渲染。sizing/extra class（ls-icon-sm 等）
  保留在 `~style_class`

内联 svg path（非 tabler 的自定义 path，如 rotating_arrow）→
`~name:(`app "…")` 并把 path 注册进 app_icons；svg/path 子节点删除。

## 禁止项

- `~attrs` JSON 逃逸舱 —— 全部翻成 typed props 或删
- `~html` innerHTML —— 改成 children
- `~events` DOM 事件字符串 —— 用 kind 事件 props / `register_press`
- `~id` DOM id —— `~accessibility_identifier`
- `mock-text`/`block-editor` 这类**被 imperative 代码当查询句柄的 class**
  —— 其查找逻辑随 editor surface extension 一并处理，视图层先迁、
  imperative 引用逐个改 `accessibility_identifier`/node id

## editor surface（平台特有 → extension）

`editor_wrapper`/`editor_inner`/`mock_text` 三元组 + 内部 textarea
是编辑器表面（可编辑区 + caret mirror 供 popup 定位）。它是平台
特有件 —— 收拢成单个 `logseq-editor` extension 节点，各 host 在
extension 内部实现自己的可编辑 surface：

- web：extension 内部仍挂 DOM 结构（textarea + caret mirror），
  imperative_dom 从 class/id 查询改为 extension 节点 id 直接索引
- GPUI：真实编辑控件（gpui-component InputState editor 或自绘
  block editor surface）
- SwiftUI：原生 TextEditor/UITextView 桥

`#ref`/`data-ref`/`.editor-inner`/`.mock-text`/`.block-editor` 这些
imperative 查询句柄随 extension 一并收编 —— 视图层不再有 DOM 句柄，
imperative 侧按 node id + `#ref` 快照定位（与 dom-op 通道同一套）。

## 验收

每个迁移包（一目录）：
1. `dune build` 零警告
2. `dom`/`Logseq_dom` 引用清零（`rg "dom ~"` 无剩余）
3. web 端视觉抽查（style_class 保留，CSS 不变则 parity 自动成立）
