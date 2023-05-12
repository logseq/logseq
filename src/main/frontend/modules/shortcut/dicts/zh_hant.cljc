(ns frontend.modules.shortcut.dicts.zh-hant
  "Provides dictionary entries for shortcuts in zh-Hant")

(def dict
  {:command.editor/indent                  "縮進塊標簽"
   :command.editor/outdent                 "取消縮進塊"
   :command.editor/move-block-up           "向上移動塊"
   :command.editor/move-block-down         "向下移動塊"
   :command.editor/new-block               "創建塊"
   :command.editor/new-line                "塊中新建行"
   :command.editor/zoom-in                 "聚焦"
   :command.editor/zoom-out                "推出聚焦"
   :command.editor/follow-link             "跟隨光標下的鏈接"
   :command.editor/open-link-in-sidebar    "在側邊欄打開"
   :command.editor/expand-block-children   "展開"
   :command.editor/collapse-block-children "折疊"
   :command.editor/select-block-up         "選擇上方的塊"
   :command.editor/select-block-down       "選擇下方的塊"
   :command.editor/select-all-blocks       "選擇所有塊"
   :command.ui/toggle-help                 "顯示/關閉幫助"
   :command.git/commit                     "提交消息"
   :command.go/search                      "全文搜索"
   :command.ui/toggle-document-mode        "切換文檔模式"
   :command.ui/toggle-theme                "“在暗色/亮色主題之間切換”"
   :command.ui/toggle-right-sidebar        "啟用/關閉右側欄"
   :command.go/journals                    "跳轉到日記"})
