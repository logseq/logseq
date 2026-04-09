(ns logseq.tasks.lang-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.tasks.lang-lint :as lang-lint]))

(deftest hardcoded-string-findings-detect-notification-literals
  (let [findings (lang-lint/hardcoded-string-findings
                  "src/main/frontend/components/example.cljs"
                  "(ns frontend.components.example)\n(notification/show! \"Copied!\" :success)\n")]
    (is (= [{:kind :notification
             :file "src/main/frontend/components/example.cljs"
             :line 2
             :text "Copied!"}]
           findings))))

(deftest hardcoded-string-findings-handle-user-facing-attr-pattern
  (testing "literal placeholder, title, aria-label, alt, and label values are reported"
    (let [findings (lang-lint/hardcoded-string-findings
                    "src/main/frontend/components/example.cljs"
                    "(ns frontend.components.example)
                    [:input {:placeholder \"Type to search\"}]
                    [:button {:title \"Open item\"} (t :general/open)]
                    [:button.icon-button {:aria-label \"Search\"}]
                    [:img {:alt \"Export preview\"}]
                    [:div {:label \"Select all\"}]")]
      (is (= [{:kind :placeholder
               :file "src/main/frontend/components/example.cljs"
               :line 2
               :text "Type to search"}
              {:kind :title
               :file "src/main/frontend/components/example.cljs"
               :line 3
               :text "Open item"}
              {:kind :aria-label
               :file "src/main/frontend/components/example.cljs"
               :line 4
               :text "Search"}
              {:kind :alt
               :file "src/main/frontend/components/example.cljs"
               :line 5
               :text "Export preview"}
              {:kind :label
               :file "src/main/frontend/components/example.cljs"
               :line 6
               :text "Select all"}]
             findings))))
  (testing "non-literal or intentionally ignored attribute values are skipped"
    (let [findings (lang-lint/hardcoded-string-findings
                    "src/main/frontend/components/example.cljs"
                    "(ns frontend.components.example)
                    [:input {:placeholder (t :search/placeholder)}]
                    [:input {:placeholder \"http://\"}]
                    [:input {:placeholder \"https://\"}]
                    [:input {:placeholder \"{}\"}]
                    [:input {:placeholder \"git commit -m ...\"}]
                    [:button {:title \"Logseq\"}]
                    (shui/dialog-open! component {:label :app-settings})")]
      (is (empty? findings)))))

(deftest hardcoded-string-findings-handle-hiccup-text-pattern
  (testing "literal text in supported tags and tag shorthand is reported"
    (let [findings (lang-lint/hardcoded-string-findings
                    "src/main/mobile/example.cljs"
                    "(ns mobile.example)
                    [:button \"Save\"]
                    [:label \"Graph name\"]
                    [:div.publish-search-hint \"Up/Down to navigate\"]
                    [:p \"Troubleshooting steps\"]
                    [:small \"Current chapter\"]
                    [:strong \"Writing mode\"]")]
      (is (= [{:kind :hiccup-text
               :file "src/main/mobile/example.cljs"
               :line 2
               :text "Save"}
              {:kind :hiccup-text
               :file "src/main/mobile/example.cljs"
               :line 3
               :text "Graph name"}
              {:kind :hiccup-text
               :file "src/main/mobile/example.cljs"
               :line 4
               :text "Up/Down to navigate"}
              {:kind :hiccup-text
               :file "src/main/mobile/example.cljs"
               :line 5
               :text "Troubleshooting steps"}
              {:kind :hiccup-text
               :file "src/main/mobile/example.cljs"
               :line 6
               :text "Current chapter"}
              {:kind :hiccup-text
               :file "src/main/mobile/example.cljs"
               :line 7
               :text "Writing mode"}]
             findings))))
  (testing "supported text children are still reported on lines that also contain user-facing attrs"
    (let [findings (lang-lint/hardcoded-string-findings
                    "src/main/frontend/components/example.cljs"
                    "(ns frontend.components.example)\n[:div {:title \"Open item\"} [:span \"Visible text\"]]\n")]
      (is (= [{:kind :title
               :file "src/main/frontend/components/example.cljs"
               :line 2
               :text "Open item"}
              {:kind :hiccup-text
               :file "src/main/frontend/components/example.cljs"
               :line 2
               :text "Visible text"}]
             findings))))
  (testing "dynamic text and non-localizable glyphs are skipped"
    (let [findings (lang-lint/hardcoded-string-findings
                    "src/main/frontend/components/example.cljs"
                    "(ns frontend.components.example)\n[:button (t :general/save)]\n[:span (str total \" items\")]\n[:button \"⌘K\"]\n[:span \"→\"]\n")]
      (is (empty? findings)))))

(deftest hardcoded-string-findings-ignore-non-ui-strings
  (testing "class names and data attributes are not user-facing strings"
    (let [findings (lang-lint/hardcoded-string-findings
                    "src/main/frontend/components/example.cljs"
                    "(ns frontend.components.example)\n[:div {:class \"cp__sidebar-main-content\" :data-testid \"settings-panel\"}]\n")]
      (is (empty? findings)))))

(deftest hardcoded-string-findings-ignore-commented-samples
  (testing "commented hiccup examples are not source UI strings"
    (let [findings (lang-lint/hardcoded-string-findings
                    "src/main/frontend/components/example.cljs"
                    "(ns frontend.components.example)\n;;[:p \"Commented text\"]\n;;[:li \"Commented item\"]\n(comment\n[:img {:alt \"Commented image\"}]\n[:p \"Commented paragraph\"])\n")]
      (is (empty? findings)))))

(deftest translation-placeholders-detect-placeholder-sets
  (is (= #{"1" "2"}
         (lang-lint/translation-placeholders "Open {1} from {2}")))
  (is (= #{}
         (lang-lint/translation-placeholders "Search with Google"))))

(deftest conditional-translation-keys-detect-dynamic-i18n-branches
  (let [content "(t (if public? :page/make-private :page/make-public))\n{:payload {:i18n-key (if delete? :outliner/cant-remove-tag-built-in :outliner/cant-set-tag-built-in)}}\n"]
    (is (= #{:page/make-private
             :page/make-public
             :outliner/cant-remove-tag-built-in
             :outliner/cant-set-tag-built-in}
           (lang-lint/conditional-translation-keys content)))))

(deftest conditional-translation-keys-detect-local-i18n-key-bindings
  (let [content "(let [i18n-key (if (:logseq.property/created-from-property block)\n:outliner/cant-convert-property-value-to-page\n:outliner/cant-convert-block-parent-not-page)])"]
    (is (= #{:outliner/cant-convert-property-value-to-page
             :outliner/cant-convert-block-parent-not-page}
           (lang-lint/conditional-translation-keys content)))))

(deftest translation-call-fallback-keys-detect-default-or-branches
  (let [content "(t (or title-key :views.table/default-title) props)"]
    (is (= #{:views.table/default-title}
           (lang-lint/translation-call-fallback-keys content)))))

(deftest option-translation-keys-detect-literal-config-keys
  (let [content "{:prompt-key :graph.switch/select-prompt}\n{:title-key :page/table-title}\n"]
    (is (= #{:graph.switch/select-prompt}
           (lang-lint/option-translation-keys content :prompt-key)))
    (is (= #{:page/table-title}
           (lang-lint/option-translation-keys content :title-key)))))

(deftest built-in-color-keys-detect-color-translations
  (let [content "(def built-in-colors\n[\"yellow\"\n\"red\"\n\"gray\"])"]
    (is (= #{:color/yellow :color/red :color/gray}
           (lang-lint/built-in-color-keys content)))))

(deftest left-sidebar-translation-keys-detect-nav-derived-keys
  (let [content "(let [navs [:flashcards :all-pages :graph-view :tag/tasks :tag/assets]])"]
    (is (= #{:nav/tasks
             :nav/assets}
           (lang-lint/left-sidebar-translation-keys content)))))

(deftest date-nlp-translation-keys-detect-derived-date-labels
  (let [content "(def nlp-pages [\"Today\" \"Last Monday\" \"Next Week\"])"]
    (is (= #{:date.nlp/today
             :date.nlp/last-monday
             :date.nlp/next-week}
           (lang-lint/date-nlp-translation-keys content)))))

(deftest built-in-db-ident-translation-keys-detect-built-in-property-and-class-labels
  (let [content "(def ^:large-vars/data-var built-in-classes
                  {:logseq.class/Task {:title \"Task\"}})
                 (def ^:large-vars/data-var built-in-properties
                  {:block/alias {:title \"Alias\"}
                   :logseq.property/status {:title \"Status\"}
                   :logseq.property.repeat/recur-unit {:closed-values [[:logseq.property.repeat/recur-unit.day \"Day\"]]}
                   :logseq.property/view/type {:closed-values [[:logseq.property.view/type.table \"Table View\"]]}
                   :logseq.property/status.backlog {:title \"Backlog\"}})"]
    (is (= #{:class.built-in/task
             :property.built-in/alias
             :property.built-in/repeat-recur-unit
             :property.built-in/status
             :property.status/backlog
             :property.repeat-recur-unit/day
             :property.view-type/table}
           (lang-lint/built-in-db-ident-translation-keys content)))))

(deftest shortcut-command-keys-detect-command-translations-from-shortcut-ids
  (let [content ":window/close {:binding \"mod+w\"}\n:editor/copy {:binding \"mod+c\"}\n"]
    (is (= #{:command.window/close
             :command.editor/copy}
           (lang-lint/shortcut-command-keys content)))))

(deftest shortcut-command-keys-ignore-shortcut-handler-groups
  (let [content ":shortcut.handler/misc {:misc/copy (:misc/copy all-built-in-keyboard-shortcuts)}"]
    (is (empty? (lang-lint/shortcut-command-keys content)))))

(deftest shortcut-category-translation-keys-detect-dynamic-category-labels
  (let [content "(defonce categories\n(vector :shortcut.category/basics :shortcut.category/others))"]
    (is (= #{:shortcut.category/basics
             :shortcut.category/others}
           (lang-lint/shortcut-category-translation-keys content)))))

(deftest derived-translation-keys-merge-supported-dynamic-patterns
  (let [content "(defonce categories (vector :shortcut.category/basics))
                 (def built-in-colors [\"yellow\"])
                 (def nlp-pages [\"Today\"])
                 (let [navs [:flashcards :tag/tasks]
                 i18n-key (if delete? :outliner/cant-remove-tag-built-in :outliner/cant-set-tag-built-in)]\n
                 [(t (or title-key :views.table/default-title) props)
                  {:prompt-key :graph.switch/select-prompt
                   :title-key :page/table-title}])"]
    (is (= #{:color/yellow
             :date.nlp/today
             :shortcut.category/basics
             :nav/tasks
             :outliner/cant-remove-tag-built-in
             :outliner/cant-set-tag-built-in
             :graph.switch/select-prompt
             :page/table-title
             :views.table/default-title}
           (lang-lint/derived-translation-keys content)))))

(deftest placeholder-mismatch-findings-detect-non-default-locale-errors
  (testing "a localized value must match English placeholders exactly once it is defined"
    (let [findings (lang-lint/placeholder-mismatch-findings
                    {:en {:electron/link-open-confirm "Are you sure?\n\n{1}"
                          :electron/write-file-failed-with-backup "Write failed {1} {2} {3}."}
                     :fr {:electron/link-open-confirm "Voulez-vous ouvrir ce lien externe ?"
                          :electron/write-file-failed-with-backup "Échec de l'écriture. Sauvegarde : {1}"}
                     :zh-CN {:electron/link-open-confirm "确定要打开此链接吗？\n\n{1}"
                             :electron/write-file-failed-with-backup "写入文件 {1} 失败，{2}。备份文件已保存到 {3}。"}})]
      (is (= [{:lang :fr
               :translation-key :electron/link-open-confirm
               :expected-placeholders ["1"]
               :actual-placeholders []
               :default-value "Are you sure?\n\n{1}"
               :localized-value "Voulez-vous ouvrir ce lien externe ?"}
              {:lang :fr
               :translation-key :electron/write-file-failed-with-backup
               :expected-placeholders ["1" "2" "3"]
               :actual-placeholders ["1"]
               :default-value "Write failed {1} {2} {3}."
               :localized-value "Échec de l'écriture. Sauvegarde : {1}"}]
             findings)))))

(deftest translation-rich-validation-findings-report-rich-contract-mismatches
  (testing "a localized rich translation must remain a zero-arg function once defined"
    (is (= [{:lang :fr
             :translation-key :e2ee/cloud-password-rich
             :expected-value-kind :fn
             :actual-value-kind :string}
            {:lang :fr
             :translation-key :on-boarding/main-title
             :expected-value-kind :fn
             :actual-value-kind :string}]
           (lang-lint/rich-translation-mismatch-findings
            {:en {:on-boarding/main-title (fn [] ["Welcome to " [:strong "Logseq!"]])
                  :e2ee/cloud-password-rich (fn [] ["Cloud sentence " [:span "Local sentence"]])
                  :e2ee/remember-password-rich (fn [] [[:span "Remember "] "your password."])}
             :fr {:on-boarding/main-title "Bienvenue sur Logseq"
                  :e2ee/cloud-password-rich "Mot de passe cloud"
                  :e2ee/remember-password-rich (fn [] [[:span "Souvenez-vous "] "de votre mot de passe."])}})))))
