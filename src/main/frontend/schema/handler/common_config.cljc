(ns frontend.schema.handler.common-config
  "Schema that is common for global-config and repo-config"
  (:require [malli.util :as mu]))

(def Config-edn
  (mu/optional-keys
   [:map
    [:meta/version :int]
    ;; Loose since it looks like capitalization and string are possible
    [:preferred-format [:or :keyword :string]]
    [:preferred-workflow [:enum :now :todo]]
    [:hidden [:vector :string]]
    [:default-templates [:map-of
                         [:enum :journals]
                         :string]]
    [:ui/enable-tooltip? :boolean]
    [:ui/show-brackets? :boolean]
    [:feature/enable-block-timestamps? :boolean]
    [:feature/enable-search-remove-accents? :boolean]
    [:feature/enable-journals? :boolean]
    [:feature/enable-flashcards? :boolean]
    [:feature/disable-scheduled-and-deadline-query? :boolean]
    [:start-of-week [:enum 0 1 2 3 4 5 6]]
    [:custom-css-url :string]
    [:export/bullet-indentation
     [:enum :eight-spaces :four-spaces :two-spaces :tab]]
    [:publishing/all-pages-public? :boolean]
    [:default-home [:map
                    [:page {:optional true} :string]
                    [:sidebar {:optional true} [:or :string [:vector :string]]]]]
    [:pages-directory :string]
    [:journal-directory :string]
    [:org-mode/insert-file-link? :boolean]
    [:shortcuts [:map-of
                 :keyword
                 [:or :string [:vector :string]]]]
    [:shortcut/doc-mode-enter-for-new-block? :boolean]
    [:block/content-max-length :int]
    [:ui/show-command-doc? :boolean]
    [:ui/show-empty-bullets? :boolean]
    [:ui/show-full-blocks? :boolean]
    [:query/views [:map-of
                   :keyword
                   [:sequential any?]]]
    [:query/result-transforms [:map-of
                               :keyword
                               [:sequential any?]]]
    [:default-queries [:map
                       ;; Maybe validate these query maps later
                       [:journals [:vector :map]]]]
    [:commands [:vector [:tuple
                         :string
                         [:or :string [:vector :some]]]]]
    [:outliner/block-title-collapse-enabled? :boolean]
    [:macros [:map-of
              [:or :string :keyword]
              :string]]
    [:ref/default-open-blocks-level :int]
    [:ref/linked-references-collapsed-threshold :int]
    [:favorites [:vector :string]]
    ;; There isn't a :float yet
    [:srs/learning-fraction float?]
    [:srs/initial-interval :int]
    [:block-hidden-properties [:set :keyword]]
    [:property-pages/enabled? :boolean]
    [:property-pages/excludelist [:set :keyword]]
    [:property/separated-by-commas [:set :keyword]]
    [:ignored-page-references-keywords [:set :keyword]]
    [:logbook/settings :map]
    [:mobile/photo [:map
                    [:allow-editing? {:optional true} :boolean]
                    [:quality {:optional true} :int]]]
    [:mobile [:map
              [:gestures/disabled-in-block-with-tags {:optional true} [:vector :string]]]]
    [:editor/extra-codemirror-options :map]
    [:editor/logical-outdenting? :boolean]
    [:editor/preferred-pasting-file? :boolean]
    [:quick-capture-templates [:map
                               [:text {:optional true} :string]
                               [:media {:optional true} :string]]]
    [:quick-capture-options [:map
                             [:insert-today? {:optional true} :boolean]
                             [:redirect-page? {:optional true} :boolean]]]
    [:file-sync/ignore-files [:vector :string]]
    [:dwim/settings [:map-of :keyword :boolean]]
    [:file/name-format [:enum :legacy :triple-lowbar]]]))
