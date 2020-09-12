(ns frontend.tools.tongue
  (:require [tongue.core :as tongue]
            [frontend.state :as state]
            [clojure.string :as string]))


;; TODO
;; - [ ] Localizing Number Formats
;; - [ ] Localizing Dates

(def dicts
  {:en {:on-boaring {:title "Hi, welcome to Logseq!"
                     :notice "Notice that this project is in its early days and under quick development, files might be corrupted."}
        :right-side-bar {:help "Help"
                         :switch-theme #(str "Switch to " % " theme")
                         :theme #(cond
                                   (= "white" %) "White theme"
                                   (= "dark" %) "Dark theme")
                         :page "Page graph"
                         :recent "Recent"
                         :contents "Contents"
                         :graph-ref "Graph of "
                         :block-ref "Block reference"}
        :git {:set-access-token "Set Github personal access token"
              :token-is-encrypted "The token will be encrypted and stored in the browser local storage"
              :token-server "The server will never store it"
              :create-personal-access-token "How to create a Github personal access token?"
              :push "Push now"
              :local-changes-synced "All local changes are synced!"
              :pull "Pull now"
              :last-pull "Last pulled at"
              :version "Version"
              :import-notes "Import your notes"
              :import-notes-helper "You can import your notes from a repo on Github."
              :add-another-repo "Add another repo"
              :re-index "Clone again and re-index the db"
              :commit {:message "Your commit message"
                       :commit-and-push "Commit and push!"}
              :diff {:use-remote "Use remote"
                     :keep-local "Keep local"
                     :edit "Edit"
                     :title "Diff"
                     :no-diffs "No diffs"
                     :commit-message "Commit message (optional)"
                     :pushing "Pushing"
                     :force-push "Commit and force pushing"
                     :a-force-push "A force push"}}
        :format {:preferred-mode "What's your preferred mode?"
                 :markdown "Markdown"
                 :org-mode "Org Mode"}
        :reference {:linked "Linked Reference"
                    :unlinked-ref "Unlinked References"}
        :project {:setup "Setup a public project on Logseq"
                  :location "All published pages will be located under"}
        :page {:presentation-mode "Presentation mode (Powered by Reveal.js)"
               :delete-success #(str "Page " % " was delted successfully!")
               :delete-confirmation "Are you sure you want to delte this page?"
               :rename-to #(str "Rename \"" % "\" to:")
               :priority #(str "Priority \"" (string/upper-case %) "\"")
               :re-index "Re-index this page"
               :copy-to-json "Copi the whole page as JSON"
               :rename "Rename page"
               :delete "Delete page (will delete the file too)"
               :publish "Publish this page on Logseq"
               :publish-as-slide "Publish this page as a slide on Logseq"
               :unpublish "Un-publish this page on Logseq"
               :show-journals "Show Journals"
               :show-name "Show page name"
               :hide-name "Hide page name"
               :name "Page name"
               :last-modified "Last modified at"
               :new-title "What's your new page title?"}
        :journal {:multiple-files-with-different-formats "It seems that you have multiple journal files (with different formats) for the same month, please only keep one journal file for each month."
                  :go-to "Go to files"}
        :file {:name "File name"
               :last-modified-at "Last modified at"
               :no-data "No data"
               :format-not-supported #(str "Format ." % " is not supported.")}
        :editor {:block-search "Search for a block"
                 :image-uploading "Uploading"}
        :draw {:invalid-file "Could not load this invalid excalidraw file"
               :specify-title "Please specify a title first!"
               :rename-success "File was renamed successfully!"
               :rename-failure "Rename file failed, reason: "
               :title-placeholder "Untitled"
               :save "Save"
               :save-changes "Save changes"
               :new-file "New file"
               :list-files "List files"
               :delete "Delete"
               :more-options "More options"
               :back-to-logseq "Back to logseq"}
        :content {:copy "Copy"
                  :cut "Cut"
                  :make-todos #(str "Make " % "s")
                  :copy-block-ref "Copy block ref"
                  :focus-on-block "Focus on block"
                  :open-in-sidebar "Open in sidebar"
                  :copy-as-json "Copy as JSON"
                  :click-to-edit "Click to edit"}
        :commands {}
        :logseq "Logseq"
        :dot-mode "Dot mode"
        :on "ON"
        :more-options "More options"
        :to "to"
        :yes "Yes"
        :submit "Submit"
        :cancel "Cancel"
        :re-index "Re-index"
        :export-json "Export as JSON"
        :unlink "unlink"
        :search "Search"
        :new-page "New page"
        :graph "Graph"
        :all-repos "All repos"
        :all-pages "All pages"
        :all-files "All files"
        :settings "Settings"
        :join-community "Join the community"
        :discord-title "Our discord group!"
        :sign-out "Sign out"
        :help-shortcut-title "Click to check shortcuts and other tips"
        :loading "Loading"
        :cloning "Cloning"
        :parsing-files "Parsing files"
        :loading-files "Loading files"
        :login-github "Login with Github"
        :excalidraw-title "Draw with Excalidraw"
        :go-to "Go to "
        :or "or"
        :download "Download"}

   :zh-CN {:on-boaring {:title "你好，欢迎使用 Logseq！"
                     :notice "请注意，本项目正在快速开发中，存在文件损坏的风险。"}
        :right-side-bar {:help "帮助"
                         :switch-theme #(str "切换到" % "主题")
                         :theme #(cond
                                   (= "white" %) "亮色主题"
                                   (= "dark" %) "暗色主题")
                         :page "页面图谱"
                         :recent "最近"
                         :contents "目录"
                         :graph-ref "图谱"
                         :block-ref "块引用"}
        :git {:set-access-token "Set Github personal access token"
              :token-is-encrypted "The token will be encrypted and stored in the browser local storage"
              :token-server "The server will never store it"
              :create-personal-access-token "How to create a Github personal access token?"
              :push "现在 push"
              :local-changes-synced "所有本地更改已同步！"
              :pull "现在 pull"
              :last-pull "最后 pull 时间 "
              :version "版本"
              :import-notes "导入笔记"
              :import-notes-helper "你可以从 Github 的库中倒入笔记"
              :add-another-repo "添加一个库"
              :re-index "重新 clone 然后重新建立索引"
              :commit {:message "你的 commit 信息"
                       :commit-and-push "commit 并 push"}
              :diff {:use-remote "使用云端版本"
                     :keep-local "使用本地版本"
                     :edit "编辑"
                     :title "文件冲突"
                     :no-diffs "没有文件冲突"
                     :commit-message "commit 消息（可选）"
                     :pushing "Pushing"
                     :force-push "Commit 并强制 push"
                     :a-force-push "强制 push"}}
        :format {:preferred-mode "请选择偏好格式"
                 :markdown "Markdown"
                 :org-mode "Org Mode"}
        :reference {:linked "已链接的引用"
                    :unlinked-ref "未链接的引用"}
        :project {:setup "在 Logseq 上发布新的项目"
                  :location "一切发布的页面将会被放到 "}
        :page {:presentation-mode "演讲模式 (由 Reveal.js 驱动)"
               :delete-success #(str "页面 " % " 删除成功！")
               :delete-confirmation "你确定要删除此页面吗？"
               :rename-to #(str "重命名\"" % "\" 至：")
               :priority #(str "优先级 \"" (string/upper-case %) "\"")
               :re-index "对此页面重新建立索引"
               :copy-to-json "将整页以 JSON 格式复制"
               :rename "重命名本页"
               :delete "删除本页（并删除文件）"
               :publish "将本页发布至 Logseq"
               :publish-as-slide "将本页作为幻灯片发布至 Logseq"
               :unpublish "取消将本页发布至 Logseq"
               :show-journals "显示日志"
               :show-name "显示页面名"
               :hide-name "隐藏页面名"
               :name "页面名"
               :last-modified "最后更改于"
               :new-title "请输入新页面的名字:"}
        :journal {:multiple-files-with-different-formats "It seems that you have multiple journal files (with different formats) for the same month, please only keep one journal file for each month."
                  :go-to "转到所有文件"}
        :file {:name "文件名"
               :last-modified-at "最后更改于"
               :no-data "没有数据"
               :format-not-supported #(str "格式 ." % " 目前不支持.")}
        :editor {:block-search "搜索块"
                 :image-uploading "上传中"}
        :draw {:invalid-file "Could not load this invalid excalidraw file"
               :specify-title "请先指定标题!"
               :rename-success "文件重命名成功!"
               :rename-failure "文件重命名失败，原因是："
               :title-placeholder "未命名"
               :save "保存"
               :save-changes "保存更改"
               :new-file "新文件"
               :list-files "所有文件"
               :delete "删除"
               :more-options "更多选项"
               :back-to-logseq "返回 logseq"}
        :content {:copy "复制"
                  :cut "剪切"
                  :make-todos #(str "格式化为 " %)
                  :copy-block-ref "复制块引用"
                  :focus-on-block "聚焦在此块"
                  :open-in-sidebar "在侧边栏打开"
                  :copy-as-json "复制为 JSON"
                  :click-to-edit "点击以编辑"}
        :commands {}
        :logseq "Logseq"
        :dot-mode "点模式"
        :on "ON"
        :more-options "更多选项"
        :to "to"
        :yes "是"
        :submit "提交"
        :cancel "取消"
        :re-index "重新建立索引"
        :export-json "以 JSON 格式导出"
        :unlink "解除绑定"
        :search "搜索"
        :new-page "新页面"
        :graph "图谱"
        :all-repos "所有库"
        :all-pages "所有页面"
        :all-files "所有文件"
        :settings "设置"
        :join-community "加入社区"
        :discord-title "我们的 Discord 社群!"
        :sign-out "登出"
        :help-shortcut-title "点此查看快捷方式和更多游泳帮助"
        :loading "加载中"
        :cloning "Clone 中"
        :parsing-files "正在解析文件"
        :loading-files "正在加载文件"
        :login-github "用 Github 登陆"
        :excalidraw-title "用 Excalidraw 画图"
        :go-to "转到"
        :or "或"
        :download "下载"}

  :tongue/fallback :en})

(def languages [{:label "English" :value :en}
                {:label "简体中文" :value :zh-CN}])

(def translate
  (tongue/build-translate dicts))
