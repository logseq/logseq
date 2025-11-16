import UIKit
import Capacitor
import Intents

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UINavigationControllerDelegate {

    var window: UIWindow?
    private var navController: UINavigationController?
    private var pathStack: [String] = ["/"]
    private var ignoreRoutePopCount = 0

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        let nav = UINavigationController()
        navController = nav
        nav.navigationBar.prefersLargeTitles = false
        nav.delegate = self

        let rootPath = "/"
        let rootVC = NativePageViewController(path: rootPath, push: true, title: "Logseq")
        nav.setViewControllers([rootVC], animated: false)

        window?.rootViewController = nav
        window?.makeKeyAndVisible()
        observeRouteChanges()

        if let shortcutItem = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
            DispatchQueue.main.async {
                _ = self.handleShortcutItem(shortcutItem)
            }
        }
        return true
    }

    func application(_ application: UIApplication,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        let handled = handleShortcutItem(shortcutItem)
        completionHandler(handled)
    }

    private func handleShortcutItem(_ shortcutItem: UIApplicationShortcutItem) -> Bool {
        switch shortcutItem.type {
        case "logseq.quickadd":
            donateQuickAddShortcut()
            openURL("logseq://mobile/go/quick-add")
            return true
        case "logseq.voice":
            donateAudioShortcut()
            openURL("logseq://mobile/go/audio")
            return true
        default:
            return false
        }
    }

    func application(_ application: UIApplication,
                 continue userActivity: NSUserActivity,
                 restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {

        // Case 1: custom NSUserActivities
        if userActivity.activityType == "com.logseq.quickadd" {
            openURL("logseq://mobile/go/quick-add")
            return true
        }
        if userActivity.activityType == "com.logseq.audio" {
            openURL("logseq://mobile/go/audio")
            return true
        }

        // Case 2: Universal Links
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            print("🌐 Universal link opened:", url)
        }

        // Default: let Capacitor handle other cases
        return ApplicationDelegateProxy.shared.application(application,
                                                           continue: userActivity,
                                                           restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        print("🔥 opened with URL:", url)

        // Forward to Capacitor
        return ApplicationDelegateProxy.shared.application(application,
                                                           open: url,
                                                           options: options)
    }
    private func openURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }

    private func normalizedPath(_ raw: String?) -> String {
        guard let raw = raw, !raw.isEmpty else { return "/" }
        return raw
    }

    private func pushIfNeeded(path: String, animated: Bool) {
        let path = normalizedPath(path)
        guard let nav = navController else { return }
        if pathStack.last == path {
            return
        }
        let vc = NativePageViewController(path: path, push: true)
        pathStack.append(path)
        nav.pushViewController(vc, animated: animated)
    }

    private func replaceTop(path: String) {
        let path = normalizedPath(path)
        guard let nav = navController else { return }
        _ = pathStack.popLast()
        let vc = NativePageViewController(path: path, push: false)
        pathStack.append(path)
        var stack = nav.viewControllers
        if stack.isEmpty {
            stack = [vc]
        } else {
            stack[stack.count - 1] = vc
        }
        nav.setViewControllers(stack, animated: false)
    }

    private func popIfNeeded(animated: Bool) {
        guard let nav = navController else { return }
        if nav.viewControllers.count > 1 {
            _ = pathStack.popLast()
            nav.popViewController(animated: animated)
        }
    }

    func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {
        guard let toVC = viewController as? NativePageViewController else { return }
        guard let coordinator = navigationController.transitionCoordinator else { return }
        let vcs = navigationController.viewControllers
        let toIndex = vcs.firstIndex(of: toVC)
        let fromVC = coordinator.viewController(forKey: .from) as? NativePageViewController
        let fromIndex = fromVC.flatMap { vcs.firstIndex(of: $0) }

        let isPop = if let toIdx = toIndex, let fromIdx = fromIndex {
            toIdx < fromIdx
        } else {
            // fallback: compare counts
            vcs.count < pathStack.count
        }

        print("navigationController willShow isPop:", isPop,
              "from:", fromVC?.targetPath ?? "nil",
              "to:", toVC.targetPath)

        if isPop {
            // Keep native bookkeeping aligned with the upcoming pop
            if pathStack.count > 1 {
                _ = pathStack.popLast()
            }
            if let last = pathStack.last, last != toVC.targetPath {
                pathStack[pathStack.count - 1] = toVC.targetPath
            }

            // Move shared webview to destination before pop completes
            SharedWebViewController.instance.attach(to: toVC)

            // Trigger browser back so Reitit updates route-match while attached to destination
            if let webView = SharedWebViewController.instance.bridgeController.bridge?.webView,
               webView.canGoBack {
                ignoreRoutePopCount += 1
                webView.goBack()
            } else {
                // Fallback: ask JS to render without adding history
                ignoreRoutePopCount += 1
            }
        }
    }

    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
        guard let current = viewController as? NativePageViewController else { return }
        SharedWebViewController.instance.attach(to: current)
    }

    private func observeRouteChanges() {
        NotificationCenter.default.addObserver(
            forName: UILocalPlugin.routeChangeNotification,
            object: nil,
            queue: OperationQueue.main
        ) { [weak self] notification in
            guard let self else { return }
            let path = self.normalizedPath(notification.userInfo?["path"] as? String)
            let navigationType = (notification.userInfo?["navigationType"] as? String) ?? "push"
            print("navigation type:", navigationType)
            switch navigationType {
            case "replace":
                self.replaceTop(path: path)
            case "pop":
                if self.ignoreRoutePopCount > 0 {
                    self.ignoreRoutePopCount -= 1
                    return
                }
                // JS popped browser history; align native stack if needed.
                if self.pathStack.count > 1 {
                    self.popIfNeeded(animated: true)
                }
            default:
                // push
                self.pushIfNeeded(path: path, animated: true)
            }
        }
    }

}

extension NSUserActivity {
    static var quickAdd: NSUserActivity {
        let activity = NSUserActivity(activityType: "com.logseq.quickadd")
        activity.title = "Quick Add"
        activity.isEligibleForSearch = true
        activity.isEligibleForPrediction = true
        activity.persistentIdentifier = NSUserActivityPersistentIdentifier("com.logseq.quickadd")
        activity.suggestedInvocationPhrase = "Quick Add in Logseq"
        return activity
    }

    static var recordAudio: NSUserActivity {
        let activity = NSUserActivity(activityType: "com.logseq.audio")
        activity.title = "Record Audio"
        activity.isEligibleForSearch = true
        activity.isEligibleForPrediction = true
        activity.persistentIdentifier = NSUserActivityPersistentIdentifier("com.logseq.audio")
        activity.suggestedInvocationPhrase = "Record in Logseq"
        return activity
    }
}

extension AppDelegate {
    func donateQuickAddShortcut() {
        let activity = NSUserActivity.quickAdd
        window?.rootViewController?.userActivity = activity
        activity.becomeCurrent()
        print("✅ Donated Quick Add (NSUserActivity)")
    }

    func donateAudioShortcut() {
        let activity = NSUserActivity.recordAudio
        window?.rootViewController?.userActivity = activity
        activity.becomeCurrent()
        print("✅ Donated Record Audio (NSUserActivity)")
    }
}
