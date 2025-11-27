import UIKit
import Capacitor
import Intents
import SwiftUI

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UINavigationControllerDelegate {

    var window: UIWindow?
    var navController: UINavigationController?
    private var pathStack: [String] = ["/"]
    private var ignoreRoutePopCount = 0
    private var popSnapshotView: UIView?

    private lazy var navigationSwipeGesture: UISwipeGestureRecognizer = {
        let gesture = UISwipeGestureRecognizer(target: self, action: #selector(handleNavigationSwipe(_:)))
        gesture.direction = .right
        gesture.cancelsTouchesInView = false
        return gesture
    }()

    private func normalizedPath(_ raw: String?) -> String {
        guard let raw = raw, !raw.isEmpty else { return "/" }
        return raw
    }

    // ---------------------------------------------------------
    // MARK: UIApplication lifecycle
    // ---------------------------------------------------------

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
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

    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        let config = UISceneConfiguration(
            name: "Default Configuration",
            sessionRole: connectingSceneSession.role
        )
        config.delegateClass = SceneDelegate.self
        return config
    }

    func application(_ application: UIApplication,
                     didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {}

    // ---------------------------------------------------------
    // MARK: Shortcuts
    // ---------------------------------------------------------

    @discardableResult
    func handleShortcutItem(_ shortcutItem: UIApplicationShortcutItem) -> Bool {
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

        if userActivity.activityType == "com.logseq.quickadd" {
            openURL("logseq://mobile/go/quick-add")
            return true
        }

        if userActivity.activityType == "com.logseq.audio" {
            openURL("logseq://mobile/go/audio")
            return true
        }

        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            print("🌐 Universal link:", url)
        }

        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }

    func application(_ application: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        print("🔥 opened with URL:", url)

        return ApplicationDelegateProxy.shared.application(
            application,
            open: url,
            options: options
        )
    }

    private func openURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }

    // ---------------------------------------------------------
    // MARK: Navigation operations
    // ---------------------------------------------------------

    private func pushIfNeeded(path: String, animated: Bool) {
        let path = normalizedPath(path)
        guard let nav = navController else { return }
        if pathStack.last == path { return }

        if let fromVC = nav.topViewController as? NativePageViewController {
            SharedWebViewController.instance.storeSnapshot(for: fromVC)
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

    // ---------------------------------------------------------
    // MARK: Navigation Delegate
    // ---------------------------------------------------------

    func navigationController(
        _ navigationController: UINavigationController,
        willShow viewController: UIViewController,
        animated: Bool
    ) {
        guard let toVC = viewController as? NativePageViewController else { return }
        guard let coordinator = navigationController.transitionCoordinator else { return }

        let vcs = navigationController.viewControllers
        let toIndex = vcs.firstIndex(of: toVC)
        let fromVC = coordinator.viewController(forKey: .from) as? NativePageViewController
        let fromIndex = fromVC.flatMap { vcs.firstIndex(of: $0) }

        let isPop = if let to = toIndex, let from = fromIndex {
            to < from
        } else {
            vcs.count < pathStack.count
        }

        if isPop {
            let previousStack = pathStack
            if pathStack.count > 1 { _ = pathStack.popLast() }
            if let last = pathStack.last, last != toVC.targetPath {
                pathStack[pathStack.count - 1] = toVC.targetPath
            }

            popSnapshotView?.removeFromSuperview()
            popSnapshotView = nil

            if let snapshot = SharedWebViewController.instance.snapshot(for: toVC) {
                let iv = UIImageView(image: snapshot)
                iv.frame = toVC.view.bounds
                iv.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                toVC.view.addSubview(iv)
                popSnapshotView = iv
            }

            coordinator.animate(alongsideTransition: nil) { ctx in
                guard !ctx.isCancelled else {
                    self.pathStack = previousStack
                    if let fromVC {
                        SharedWebViewController.instance.attach(to: fromVC)
                    }
                    SharedWebViewController.instance.clearPlaceholder()
                    return
                }

                if let webView = SharedWebViewController.instance.bridgeController.bridge?.webView,
                   webView.canGoBack {
                    self.ignoreRoutePopCount += 1
                    webView.goBack()
                } else {
                    self.ignoreRoutePopCount += 1
                }

                SharedWebViewController.instance.attach(
                    to: toVC,
                    leavePlaceholderInPreviousParent: fromVC != nil
                )

                if let snapshot = self.popSnapshotView {
                    toVC.view.bringSubviewToFront(snapshot)
                }

                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    SharedWebViewController.instance.clearPlaceholder()
                    self.popSnapshotView?.removeFromSuperview()
                    self.popSnapshotView = nil
                }
            }
        }
    }

    func navigationController(
        _ navigationController: UINavigationController,
        didShow viewController: UIViewController,
        animated: Bool
    ) {
        guard let current = viewController as? NativePageViewController else { return }

        if !NativeBottomSheetPlugin.isPresentingSheet {
            SharedWebViewController.instance.clearPlaceholder()
            SharedWebViewController.instance.attach(to: current)
        }

        attachNavigationSwipeGesture()
    }

    func navigationController(
        _ navigationController: UINavigationController,
        animationControllerFor operation: UINavigationController.Operation,
        from fromVC: UIViewController,
        to toVC: UIViewController
    ) -> UIViewControllerAnimatedTransitioning? {
        // Sidebar animator removed → always return nil
        return nil
    }

    // ---------------------------------------------------------
    // MARK: Gestures
    // ---------------------------------------------------------

    private func attachNavigationSwipeGesture() {
        guard let nav = navController else { return }

        if let edgePan = nav.interactivePopGestureRecognizer {
            navigationSwipeGesture.require(toFail: edgePan)
        }
        if navigationSwipeGesture.view !== nav.view {
            nav.view.addGestureRecognizer(navigationSwipeGesture)
        }
    }

    @objc private func handleNavigationSwipe(_ gesture: UISwipeGestureRecognizer) {
        guard gesture.state == .ended else { return }
        guard let nav = navController else { return }

        if nav.viewControllers.count > 1 {
            nav.popViewController(animated: true)
            return
        }
    }

    // ---------------------------------------------------------
    // MARK: Route Observation
    // ---------------------------------------------------------

    private func observeRouteChanges() {
        NotificationCenter.default.addObserver(
            forName: UILocalPlugin.routeChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self else { return }

            let path = self.normalizedPath(notification.userInfo?["path"] as? String)
            let navigationType = (notification.userInfo?["navigationType"] as? String) ?? "push"

            switch navigationType {
            case "replace":
                self.replaceTop(path: path)

            case "pop":
                if self.ignoreRoutePopCount > 0 {
                    self.ignoreRoutePopCount -= 1
                    return
                }

                if self.pathStack.count > 1 {
                    self.popIfNeeded(animated: true)
                }

            default:
                self.pushIfNeeded(path: path, animated: true)
            }
        }
    }
}

// ---------------------------------------------------------
// MARK: NSUserActivity utilities
// ---------------------------------------------------------

extension NSUserActivity {
    static var quickAdd: NSUserActivity {
        let a = NSUserActivity(activityType: "com.logseq.quickadd")
        a.title = "Quick Add"
        a.isEligibleForSearch = true
        a.isEligibleForPrediction = true
        a.persistentIdentifier = NSUserActivityPersistentIdentifier("com.logseq.quickadd")
        a.suggestedInvocationPhrase = "Quick Add in Logseq"
        return a
    }

    static var recordAudio: NSUserActivity {
        let a = NSUserActivity(activityType: "com.logseq.audio")
        a.title = "Record Audio"
        a.isEligibleForSearch = true
        a.isEligibleForPrediction = true
        a.persistentIdentifier = NSUserActivityPersistentIdentifier("com.logseq.audio")
        a.suggestedInvocationPhrase = "Record in Logseq"
        return a
    }
}

extension AppDelegate {
    func donateQuickAddShortcut() {
        let a = NSUserActivity.quickAdd
        window?.rootViewController?.userActivity = a
        a.becomeCurrent()
    }

    func donateAudioShortcut() {
        let a = NSUserActivity.recordAudio
        window?.rootViewController?.userActivity = a
        a.becomeCurrent()
    }

    func startRouteObservation() {
        observeRouteChanges()
    }
}
