//
//  ShareViewController.swift
//  ShareViewController
//
//  Created by leizhe on 2022/3/17.
//


import MobileCoreServices
import Social
import UIKit

class ShareItem {
    public var title: String?
    public var type: String?
    public var url: String?
}

class ShareViewController: UIViewController {
    
    private var shareItems: [ShareItem] = []
    
    var groupContainerUrl: URL? {
        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.logseq.logseq")
    }
    
    override public func viewDidAppear(_ animated: Bool) {
       super.viewDidAppear(animated)
       self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
    }
    
    private func sendData() {
        let queryItems = shareItems.map {
            [
                URLQueryItem(
                    name: "title",
                    value: $0.title?.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed) ?? ""),
                URLQueryItem(name: "description", value: ""),
                URLQueryItem(
                    name: "type",
                    value: $0.type?.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed) ?? ""),
                URLQueryItem(
                    name: "url",
                    value: $0.url?.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed) ?? ""),
            ]
        }.flatMap({ $0 })
        var urlComps = URLComponents(string: "logseq://shared?")!
        urlComps.queryItems = queryItems
        openURL(urlComps.url!)
    }
    
    fileprivate func createSharedFileUrl(_ url: URL?) -> String {
        
        let copyFileUrl = groupContainerUrl!.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)! + "/" + url!
            .lastPathComponent.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!
        try? Data(contentsOf: url!).write(to: URL(string: copyFileUrl)!)
        
        return copyFileUrl
    }
    
    func saveScreenshot(_ image: UIImage) -> String {
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd-HH-mm-ss"
        
        let copyFileUrl = groupContainerUrl!.absoluteString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!
        + dateFormatter.string(from: Date()) + ".png"
        
        do {
            try image.pngData()?.write(to: URL(string: copyFileUrl)!)
            return copyFileUrl
        } catch {
            print(error.localizedDescription)
            return ""
        }
    }
    
    fileprivate func handleTypeUrl(_ attachment: NSItemProvider)
    async throws -> ShareItem
    {
        let results = try await attachment.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil)
        let url = results as! URL?
        let shareItem: ShareItem = ShareItem()
        
        if url!.isFileURL {
            shareItem.title = url!.lastPathComponent
            shareItem.type = "application/" + url!.pathExtension.lowercased()
            shareItem.url = createSharedFileUrl(url)
        } else {
            shareItem.title = url!.absoluteString
            shareItem.url = url!.absoluteString
            shareItem.type = "text/plain"
        }
        
        return shareItem
    }
    
    fileprivate func handleTypeText(_ attachment: NSItemProvider)
    async throws -> ShareItem
    {
        let results = try await attachment.loadItem(forTypeIdentifier: kUTTypeText as String, options: nil)
        let shareItem: ShareItem = ShareItem()
        let text = results as! String
        shareItem.title = text
        shareItem.type = "text/plain"
        
        return shareItem
    }
    
    fileprivate func handleTypeMovie(_ attachment: NSItemProvider)
    async throws -> ShareItem
    {
        let results = try await attachment.loadItem(forTypeIdentifier: kUTTypeMovie as String, options: nil)
        let shareItem: ShareItem = ShareItem()
        
        let url = results as! URL?
        shareItem.title = url!.lastPathComponent
        shareItem.type = "video/" + url!.pathExtension.lowercased()
        shareItem.url = createSharedFileUrl(url)
        
        return shareItem
    }
    
    fileprivate func handleTypeImage(_ attachment: NSItemProvider)
    async throws -> ShareItem
    {
        let data = try await attachment.loadItem(forTypeIdentifier: kUTTypeImage as String, options: nil)
        
        let shareItem: ShareItem = ShareItem()
        switch data {
        case let image as UIImage:
            shareItem.title = "screenshot"
            shareItem.type = "image/png"
            shareItem.url = self.saveScreenshot(image)
        case let url as URL:
            shareItem.title = url.lastPathComponent
            shareItem.type = "image/" + url.pathExtension.lowercased()
            shareItem.url = self.createSharedFileUrl(url)
        default:
            print("Unexpected image data:", type(of: data))
        }
        
        return shareItem
    }
    
    
    override public func viewDidLoad() {
        super.viewDidLoad()
        
        shareItems.removeAll()
        
        let extensionItem = extensionContext?.inputItems.first as! NSExtensionItem
        Task {
            try await withThrowingTaskGroup(
                of: ShareItem.self,
                body: { taskGroup in
                    
                    for attachment in extensionItem.attachments! {
                        if attachment.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                            taskGroup.addTask {
                                return try await self.handleTypeUrl(attachment)
                            }
                        } else if attachment.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
                            taskGroup.addTask {
                                return try await self.handleTypeText(attachment)
                            }
                        } else if attachment.hasItemConformingToTypeIdentifier(kUTTypeMovie as String) {
                            taskGroup.addTask {
                                return try await self.handleTypeMovie(attachment)
                            }
                        } else if attachment.hasItemConformingToTypeIdentifier(kUTTypeImage as String) {
                            taskGroup.addTask {
                                return try await self.handleTypeImage(attachment)
                            }
                        }
                    }
                    
                    for try await item in taskGroup {
                        self.shareItems.append(item)
                    }
                })
            
            self.sendData()
            
        }
    }
    
    @discardableResult
    @objc func openURL(_ url: URL) -> Bool {
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                return application.perform(#selector(openURL(_:)), with: url) != nil
            }
            responder = responder?.next
        }
        return false
    }
    
}

