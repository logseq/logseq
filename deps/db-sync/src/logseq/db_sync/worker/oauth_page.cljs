(ns logseq.db-sync.worker.oauth-page
  "Browser pages for Sign in with Logseq.

  This page is served by the sync worker to third-party browsers, so it keeps
  its own English, Simplified Chinese, and Traditional Chinese copy instead of
  the desktop translation dictionaries."
  (:require [clojure.string :as string]
            [logseq.db-sync.platform.core :as platform]))

(def ^:private copy
  {:en
   {:document-title "Sign in with Logseq"
    :login-title "Sign in with Logseq"
    :login-intro "{app} wants to use a graph in your Logseq account."
    :username "Username"
    :password "Password"
    :continue "Continue"
    :invalid-credentials "The Logseq account or password is incorrect."
    :unsupported-challenge "This account needs an extra sign-in step. Sign in with Logseq cannot complete that here."
    :not-configured "Sign in with Logseq is not configured on this server."
    :unavailable "Sign in is temporarily unavailable. Try again."
    :consent-title "Choose a graph"
    :consent-intro "{app} is requesting access to one graph."
    :scope-read "Read pages, blocks, and files in the selected graph."
    :scope-write "Create and edit pages, blocks, and files in the selected graph."
    :graph "Graph"
    :no-graphs "No synced graphs are available for this account."
    :approve "Allow"
    :deny "Deny"
    :pending "This app is waiting for review, so Sign in with Logseq is not available yet."
    :rejected "This app was not approved, so Sign in with Logseq is not available."
    :unknown-app "This Logseq app is not recognized."
    :invalid-request "This sign-in request is invalid."
    :redirect-mismatch "The redirect URI does not match this app."
    :csrf "This sign-in session expired. Start again from the app."
    :graph-forbidden "You do not have access to that graph."
    :sign-in-required "Sign in with your Logseq account to continue."}
   :zh
   {:document-title "使用 Logseq 登录"
    :login-title "使用 Logseq 登录"
    :login-intro "{app} 想使用你的 Logseq 账号中的一个图谱。"
    :username "用户名"
    :password "密码"
    :continue "继续"
    :invalid-credentials "Logseq 账号或密码不正确。"
    :unsupported-challenge "这个账号还需要额外的登录步骤。使用 Logseq 登录无法在这里完成。"
    :not-configured "这台服务器还没有配置使用 Logseq 登录。"
    :unavailable "登录暂时不可用，请再试一次。"
    :consent-title "选择图谱"
    :consent-intro "{app} 请求访问一个图谱。"
    :scope-read "读取所选图谱中的页面、块和文件。"
    :scope-write "在所选图谱中创建和编辑页面、块和文件。"
    :graph "图谱"
    :no-graphs "这个账号没有可用的同步图谱。"
    :approve "允许"
    :deny "拒绝"
    :pending "这个应用还在审核中，暂时不能使用 Logseq 登录。"
    :rejected "这个应用未通过审核，不能使用 Logseq 登录。"
    :unknown-app "无法识别这个 Logseq 应用。"
    :invalid-request "这个登录请求无效。"
    :redirect-mismatch "重定向 URI 与这个应用不匹配。"
    :csrf "登录会话已过期。请从应用重新开始。"
    :graph-forbidden "你不能访问这个图谱。"
    :sign-in-required "请先使用 Logseq 账号登录。"}
   :zh-hant
   {:document-title "使用 Logseq 登入"
    :login-title "使用 Logseq 登入"
    :login-intro "{app} 想使用你的 Logseq 帳號中的一個圖譜。"
    :username "使用者名稱"
    :password "密碼"
    :continue "繼續"
    :invalid-credentials "Logseq 帳號或密碼不正確。"
    :unsupported-challenge "這個帳號還需要額外的登入步驟。使用 Logseq 登入無法在這裡完成。"
    :not-configured "這台伺服器還沒有設定使用 Logseq 登入。"
    :unavailable "登入暫時無法使用，請再試一次。"
    :consent-title "選擇圖譜"
    :consent-intro "{app} 要求存取一個圖譜。"
    :scope-read "讀取所選圖譜中的頁面、區塊和檔案。"
    :scope-write "在所選圖譜中建立和編輯頁面、區塊和檔案。"
    :graph "圖譜"
    :no-graphs "這個帳號沒有可用的同步圖譜。"
    :approve "允許"
    :deny "拒絕"
    :pending "這個應用程式還在審核中，暫時不能使用 Logseq 登入。"
    :rejected "這個應用程式未通過審核，不能使用 Logseq 登入。"
    :unknown-app "無法辨識這個 Logseq 應用程式。"
    :invalid-request "這個登入要求無效。"
    :redirect-mismatch "重新導向 URI 與這個應用程式不符。"
    :csrf "登入工作階段已過期。請從應用程式重新開始。"
    :graph-forbidden "你不能存取這個圖譜。"
    :sign-in-required "請先使用 Logseq 帳號登入。"}})

(defn request-lang
  [request]
  (let [header (string/lower-case (or (.get (.-headers request) "accept-language") ""))]
    (cond
      (or (string/includes? header "zh-hant")
          (string/includes? header "zh-tw")
          (string/includes? header "zh-hk"))
      :zh-hant

      (string/includes? header "zh")
      :zh

      :else :en)))

(defn t
  [lang key]
  (or (get-in copy [lang key])
      (get-in copy [:en key])
      ""))

(defn escape-html
  [value]
  (-> (str (or value ""))
      (string/replace "&" "&amp;")
      (string/replace "<" "&lt;")
      (string/replace ">" "&gt;")
      (string/replace "\"" "&quot;")
      (string/replace "'" "&#39;")))

(defn fill
  [template replacements]
  (reduce (fn [text [token value]]
            (string/join (escape-html value)
                         (string/split text (re-pattern (str "\\{" (name token) "\\}")))))
          (escape-html template)
          replacements))

(defn- page
  [lang title body]
  (str "<!doctype html><html lang=\"" (escape-html (name lang)) "\">"
       "<head><meta charset=\"utf-8\">"
       "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
       "<meta name=\"robots\" content=\"noindex\">"
       "<title>" (escape-html title) "</title>"
       "<style>"
       "body{font-family:system-ui,sans-serif;margin:0;background:#f6f5f3;color:#1f1d1a}"
       "main{max-width:32rem;margin:8vh auto;background:#fff;padding:1.5rem;border-radius:12px}"
       "h1{font-size:1.25rem;margin:0 0 .75rem}"
       "p{line-height:1.5}"
       "label{display:block;margin:.75rem 0}"
       "input,select,button{font:inherit}"
       "input,select{width:100%;padding:.5rem;box-sizing:border-box}"
       ".actions{margin-top:1rem}"
       "button{margin-right:.5rem;padding:.5rem .8rem}"
       ".error{color:#9b1c1c}"
       "</style></head><body><main>"
       body
       "</main></body></html>"))

(defn- hidden-inputs
  [fields]
  (apply str
         (map (fn [[name value]]
                (str "<input type=\"hidden\" name=\"" (escape-html name)
                     "\" value=\"" (escape-html value) "\">"))
              fields)))

(defn- authorize-fields
  [{:keys [client-id redirect-uri scope state code-challenge code-challenge-method response-type]}]
  [["response_type" response-type]
   ["client_id" client-id]
   ["redirect_uri" redirect-uri]
   ["scope" scope]
   ["state" state]
   ["code_challenge" code-challenge]
   ["code_challenge_method" code-challenge-method]])

(defn message-page
  [{:keys [lang title message]}]
  (page lang
        (t lang :document-title)
        (str "<h1>" (escape-html (or title (t lang :document-title))) "</h1>"
             "<p>" (escape-html message) "</p>")))

(defn login-page
  [{:keys [lang app request error]}]
  (let [error-text (when error (t lang error))]
    (page lang
          (t lang :document-title)
          (str "<h1>" (escape-html (t lang :login-title)) "</h1>"
               "<p>" (fill (t lang :login-intro) {:app (:name app)}) "</p>"
               (when (seq (:description app))
                 (str "<p>" (escape-html (:description app)) "</p>"))
               (when error-text
                 (str "<p class=\"error\">" (escape-html error-text) "</p>"))
               "<form method=\"post\" action=\"/oauth/login\" accept-charset=\"utf-8\">"
               (hidden-inputs (authorize-fields request))
               "<label>" (escape-html (t lang :username))
               "<input name=\"username\" autocomplete=\"username\" required></label>"
               "<label>" (escape-html (t lang :password))
               "<input name=\"password\" type=\"password\" autocomplete=\"current-password\" required></label>"
               "<div class=\"actions\"><button type=\"submit\">"
               (escape-html (t lang :continue))
               "</button></div></form>"))))

(defn- scope-items
  [lang scope]
  (apply str
         (map (fn [item]
                (str "<li>" (escape-html item) "</li>"))
              (cond-> []
                (string/includes? scope "logseq/read")
                (conj (t lang :scope-read))

                (string/includes? scope "logseq/write")
                (conj (t lang :scope-write))))))

(defn consent-page
  [{:keys [lang app request graphs csrf]}]
  (page lang
        (t lang :document-title)
        (str "<h1>" (escape-html (t lang :consent-title)) "</h1>"
             "<p>" (fill (t lang :consent-intro) {:app (:name app)}) "</p>"
             (when (seq (:description app))
               (str "<p>" (escape-html (:description app)) "</p>"))
             "<ul>" (scope-items lang (:scope request)) "</ul>"
             "<form method=\"post\" action=\"/oauth/consent\" accept-charset=\"utf-8\">"
             (hidden-inputs (conj (authorize-fields request) ["csrf" csrf]))
             (if (seq graphs)
               (str "<label>" (escape-html (t lang :graph))
                    "<select name=\"graph_id\">"
                    (apply str
                           (map (fn [{:keys [graph-id graph-name]}]
                                  (str "<option value=\"" (escape-html graph-id) "\">"
                                       (escape-html (or graph-name graph-id))
                                       "</option>"))
                                graphs))
                    "</select></label>"
                    "<div class=\"actions\">"
                    "<button type=\"submit\" name=\"decision\" value=\"deny\">"
                    (escape-html (t lang :deny)) "</button>"
                    "<button type=\"submit\" name=\"decision\" value=\"approve\">"
                    (escape-html (t lang :approve)) "</button></div>")
               (str "<p>" (escape-html (t lang :no-graphs)) "</p>"
                    "<div class=\"actions\">"
                    "<button type=\"submit\" name=\"decision\" value=\"deny\">"
                    (escape-html (t lang :deny)) "</button></div>"))
             "</form>")))

(defn form-action-source
  "Origin of a redirect URI. Chrome applies form-action to the redirect that
  follows a form post, so the consent page has to name the app origin."
  [redirect-uri]
  (when (string? redirect-uri)
    (try
      (let [url (js/URL. redirect-uri)
            protocol (.-protocol url)]
        (when (and (contains? #{"http:" "https:"} protocol)
                   (string/blank? (.-username url))
                   (string/blank? (.-password url)))
          (str protocol "//" (.-host url))))
      (catch :default _
        nil))))

(defn- html-headers
  [form-action-sources]
  (let [sources (->> form-action-sources
                     (filter string?)
                     distinct)
        form-action (str "form-action 'self'"
                         (when (seq sources)
                           (str " " (string/join " " sources))))]
    #js {"content-type" "text/html; charset=utf-8"
         "content-security-policy" (str "default-src 'none'; style-src 'unsafe-inline'; "
                                        form-action
                                        "; base-uri 'none'; frame-ancestors 'none'")
         "x-frame-options" "DENY"
         "referrer-policy" "no-referrer"
         "cache-control" "no-store"
         "x-content-type-options" "nosniff"}))

(defn html-response
  ([body] (html-response body 200 nil))
  ([body status] (html-response body status nil))
  ([body status form-action-sources]
   (platform/response body
                      #js {:status status
                           :headers (html-headers form-action-sources)})))

(defn redirect-response
  ([location] (redirect-response location nil))
  ([location set-cookie]
   (let [headers #js {"location" location
                      "cache-control" "no-store"
                      "referrer-policy" "no-referrer"}]
     (when set-cookie
       (aset headers "set-cookie" set-cookie))
     (platform/response nil #js {:status 303 :headers headers}))))

(defn error-status
  [error]
  (case error
    :unknown-app 404
    (:pending :rejected :graph-forbidden) 403
    (:not-configured) 500
    :unavailable 503
    (:invalid-credentials :sign-in-required) 401
    400))
