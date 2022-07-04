(ns frontend.extensions.html-parser
  (:require [cljs.core.match :refer [match]]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.config :as config]
            [frontend.util :as util]
            [hickory.core :as hickory]))

(defonce *inside-pre? (atom false))
(defn- hiccup-without-style
  [hiccup]
  (walk/postwalk (fn [f]
                   (if (map? f)
                      (apply dissoc f (conj (filter (fn [key]
                                                      (string/starts-with? (str key) ":data-"))
                                                    (keys f))
                                            :style
                                            :class))
                     f)) hiccup))

(defn- export-hiccup
  [hiccup]
  (util/format "#+BEGIN_EXPORT hiccup\n%s\n#+END_EXPORT"
               (str (hiccup-without-style hiccup))))

(def denied-tags
  #{:script :base :head :link :meta :style :title :comment :xml :svg :frame :frameset :embed :object :canvas :applet})

(defn ^:large-vars/cleanup-todo hiccup->doc-inner
  [format hiccup opts]
  (let [transform-fn (fn [hiccup opts]
                       (hiccup->doc-inner format hiccup opts))
        block-pattern (if (= format :markdown)
                        "#"
                        (config/get-block-pattern format))
        map-join (fn [children] (apply str (map #(transform-fn % opts) children)))
        block-transform (fn [level children]
                          (str (apply str (repeat level block-pattern))
                               " "
                               (->> (map #(transform-fn % opts) children)
                                    (string/join " "))
                               "\n"))
        emphasis-transform (fn [tag attrs children]
                             (let [style (:style attrs)
                                   [bold? italic? underline? strike-through? mark?]
                                   (when style
                                     [(or (string/includes? style "font-weight:700")
                                          (string/includes? style "font-weight:600"))
                                      (string/includes? style "font-style:italic")
                                      (string/includes? style "text-decoration:underline")
                                      (string/includes? style "text-decoration:line-through")
                                      (string/includes? style "background-color:#")])
                                   pattern (cond
                                             (contains? #{:b :strong} tag)
                                             (when-not (and style (string/includes? style "font-weight:normal"))
                                               (config/get-bold format))
                                             (contains? #{:i :em} tag)
                                             (when-not (and style (string/includes? style "font-style:normal"))
                                               (config/get-italic format))
                                             (contains? #{:ins} tag)
                                             (when-not (and style (string/includes? style "text-decoration:normal"))
                                               (config/get-underline format))
                                             (contains? #{:del} tag)
                                             (when-not (and style (string/includes? style "text-decoration:normal"))
                                               (config/get-strike-through format))
                                             (contains? #{:mark} tag)
                                             (when-not (and style (string/includes? style "background-color:transparent"))
                                               (config/get-highlight format))
                                             (and (contains? #{:span} tag)
                                                  (not (every? string/blank? children)))
                                             (remove nil?
                                                     [(when bold? (config/get-bold format))
                                                      (when italic? (config/get-italic format))
                                                      (when underline? (config/get-underline format))
                                                      (when strike-through? (config/get-strike-through format))
                                                      (when mark? (config/get-highlight format))])
                                             :else
                                             nil)
                                   children' (map-join children)]
                               (when (not-empty children')
                                 (str (if (string? pattern) pattern (apply str pattern))
                                      children'
                                      (if (string? pattern) pattern (apply str (reverse pattern)))))))
        wrapper (fn [tag content]
                  (let [content (cond
                                  (contains? denied-tags tag)
                                  nil

                                  (and (= tag :p) (:in-table? opts))
                                  content

                                  (contains? #{:p :hr :ul :ol :dl :table :pre :blockquote :aside :canvas
                                               :center :figure :figcaption :fieldset :div :footer
                                               :header} tag)
                                  (str "\n\n" content "\n\n")

                                  (contains? #{:thead :tr :li} tag)
                                  (str content "\n")

                                  :else
                                  content)]
                    (some-> content
                            (string/replace "<!--StartFragment-->" "")
                            (string/replace "<!--EndFragment-->" ""))))
        single-hiccup-transform
        (fn [x]
          (cond
            (vector? x)
            (let [[tag attrs & children] x
                  result (match tag
                           :head nil
                           :h1 (block-transform 1 children)
                           :h2 (block-transform 2 children)
                           :h3 (block-transform 3 children)
                           :h4 (block-transform 4 children)
                           :h5 (block-transform 5 children)
                           :h6 (block-transform 6 children)
                           :a (let [href (:href attrs)
                                    label (or (map-join children) "")
                                    has-img-tag? (util/safe-re-find #"\[:img" (str x))]
                                (when-not (string/blank? href)
                                  (if has-img-tag?
                                    (export-hiccup x)
                                    (case format
                                      :markdown (util/format "[%s](%s)" label href)
                                      :org (util/format "[[%s][%s]]" href label)
                                      nil))))
                           :img (let [src (:src attrs)
                                      alt (or (:alt attrs) "")
                                      ;; reject url-encoded and utf8-encoded(svg)
                                      unsafe-data-url? (and (string/starts-with? src "data:")
                                                            (not (re-find #"^data:.*?;base64," src)))]
                                  (when-not unsafe-data-url?
                                    (case format
                                      :markdown (util/format "![%s](%s)" alt src)
                                      :org (util/format "[[%s][%s]]" src alt)
                                      nil)))
                           :p (util/format "%s"
                                           (map-join children))

                           :hr (config/get-hr format)

                           (_ :guard #(contains? #{:b :strong
                                                   :i :em
                                                   :ins
                                                   :del
                                                   :mark
                                                   :span} %))
                           (emphasis-transform tag attrs children)

                           :code (cond
                                   @*inside-pre?
                                   (map-join children)

                                   (string? (first children))
                                   (let [pattern (config/get-code format)]
                                     (str " "
                                          (str pattern (first children) pattern)
                                          " "))

                                   ;; skip monospace style, since it has more complex children
                                   :else
                                   (map-join children))

                           :pre
                           (do
                             (reset! *inside-pre? true)
                             (let [content (string/trim (doall (map-join children)))]
                               (reset! *inside-pre? false)
                               (case format
                                 :markdown (if (util/starts-with? content "```")
                                             content
                                             (str "```\n" content "\n```"))
                                 :org (if (util/starts-with? content "#+BEGIN_SRC")
                                        content
                                        (util/format "#+BEGIN_SRC\n%s\n#+END_SRC" content))
                                 nil)))

                           :blockquote
                           (case format
                             :markdown (str "> " (map-join children))
                             :org (util/format "#+BEGIN_QUOTE\n%s\n#+END_QUOTE" (map-join children))
                             nil)

                           :li
                           (str "- " (map-join children))

                           :br
                           "\n"

                           :dt
                           (case format
                             :org (str "- " (map-join children) " ")
                             :markdown (str (map-join children) "\n")
                             nil)

                           :dd
                           (case format
                             :markdown (str ": " (map-join children) "\n")
                             :org (str ":: " (map-join children) "\n")
                             nil)

                           :thead
                           (case format
                             :markdown (let [columns (count (last (first children)))]
                                         (str
                                          (map-join children)
                                          (str "| " (string/join " | "
                                                                 (repeat columns "----"))
                                               " |")))
                             :org (let [columns (count (last (first children)))]
                                    (str
                                     (map-join children)
                                     (str "|" (string/join "+"
                                                           (repeat columns "----"))
                                          "|")))
                             nil)
                           :tr
                           (str "| "
                                (->> (map #(transform-fn % (assoc opts :in-table? true)) children)
                                     (string/join " | "))
                                " |")

                           (_ :guard #(contains? #{:aside :center :figure :figcaption :fieldset :footer :header} %))
                           (export-hiccup x)

                           :else (map-join children))]
              (wrapper tag result))

            (string? x)
            x

            :else
            (println "hiccup->doc error: " x)))
        result (if (vector? (first hiccup))
                 (for [x hiccup]
                   (single-hiccup-transform x))
                 (single-hiccup-transform hiccup))]
    (apply str result)))

(defn hiccup->doc
  [format hiccup]
  (let [s (hiccup->doc-inner format hiccup {})]
    (if (string/blank? s)
      ""
      (-> s
          string/trim
          (string/replace #"\n\n+" "\n\n")))))

(defn html-decode-hiccup
  [hiccup]
  (walk/postwalk (fn [f]
                   (if (string? f)
                     (goog.string.unescapeEntities f)
                     f)) hiccup))

(defn convert
  [format html]
  (when-not (string/blank? html)
    (let [hiccup (hickory/as-hiccup (hickory/parse html))
          decoded-hiccup (html-decode-hiccup hiccup)]
      (hiccup->doc format decoded-hiccup))))

(comment
  ;; | Syntax      | Description | Test Text     |``
  ;; | :---        |    :----:   |          ---: |
  ;; | Header      | Title       | Here's this   |
  ;; | Paragraph   | Text        | And more      |

  (def img-link
    [:a {:href "https://www.markdownguide.org/book/", :style "box-sizing: border-box; color: rgb(0, 123, 255); text-decoration: none; background-color: transparent;"} [:img {:src "https://d33wubrfki0l68.cloudfront.net/cb41dd8e38b0543a305f9c56db89b46caa802263/25192/assets/images/book-cover.jpg", :class "card-img", :alt "Markdown Guide book cover", :style "box-sizing: border-box; vertical-align: middle; border-style: none; flex-shrink: 0; width: 205.75px; border-radius: calc(0.25rem - 1px);"}]]))
