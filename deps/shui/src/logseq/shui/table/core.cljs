(ns logseq.shui.table.core
  (:require [rum.core :as rum]
            [logseq.shui.util :as util]))

(def table (util/lsui-wrap "Table"))
(def table-header (util/lsui-wrap "TableHeader"))
(def table-body (util/lsui-wrap "TableBody"))
(def table-footer (util/lsui-wrap "TableFooter"))
(def table-head (util/lsui-wrap "TableHead"))
(def table-row (util/lsui-wrap "TableRow"))
(def table-cell (util/lsui-wrap "TableCell"))
(def table-caption (util/lsui-wrap "TableCaption"))

(def ^js tanStackReact (util/lsui-get "tanStackReact"))