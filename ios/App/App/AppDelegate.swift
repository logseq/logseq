import UIKit
import Capacitor
import Intents
import BackgroundTasks

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private let refreshTaskIdentifier = "com.logseq.sync.refresh"
    private let processingTaskIdentifier = "com.logseq.sync.processing"

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        registerBackgroundTasks()
        if let shortcutItem = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
            DispatchQueue.main.async {
                _ = self.handleShortcutItem(shortcutItem)
            }
        }
        return true
    }

    private func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: refreshTaskIdentifier, using: nil) { task in
            self.handleBackground(task: task as! BGAppRefreshTask)
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: processingTaskIdentifier, using: nil) { task in
            self.handleBackground(task: task as! BGProcessingTask)
        }
    }

    private func scheduleBackgroundTasks() {
        let refreshRequest = BGAppRefreshTaskRequest(identifier: refreshTaskIdentifier)
        refreshRequest.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        do {
            try BGTaskScheduler.shared.submit(refreshRequest)
        } catch {
            print("⚠️ Failed to schedule app refresh:", error)
        }

        let processingRequest = BGProcessingTaskRequest(identifier: processingTaskIdentifier)
        processingRequest.requiresNetworkConnectivity = true
        processingRequest.requiresExternalPower = false
        do {
            try BGTaskScheduler.shared.submit(processingRequest)
        } catch {
            print("⚠️ Failed to schedule processing:", error)
        }
    }

    private func handleBackground(task: BGTask) {
        scheduleBackgroundTasks()

        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1

        let operation = BlockOperation { [weak self] in
            self?.triggerMobileBackgroundSync()
        }

        task.expirationHandler = {
            queue.cancelAllOperations()
            task.setTaskCompleted(success: false)
        }

        operation.completionBlock = {
            task.setTaskCompleted(success: !operation.isCancelled)
        }

        queue.addOperation(operation)
    }

    private func triggerMobileBackgroundSync() {
        guard let bridge = CAPBridgeViewController.bridge else {
            print("⚠️ Bridge not ready for background sync")
            return
        }
        bridge.webView?.evaluateJavaScript("window.logseqMobile?.backgroundSync?.trigger?.()") { result, error in
            if let error = error {
                print("⚠️ Background sync JS execution failed:", error)
            } else {
                print("✅ Background sync triggered from BGTask")
            }
        }
    }

    func application(_ application: UIApplication,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        let handled = handleShortcutItem(shortcutItem)
        completionHandler(handled)
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        scheduleBackgroundTasks()
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
