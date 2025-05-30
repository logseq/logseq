//
//  UILocal.swift
//  App
//
//  Created by Charlie on 2025/5/29.
//

import Foundation
import Capacitor

@objc(UILocalPlugin)
public class UILocalPlugin: CAPPlugin, CAPBridgedPlugin {
  
  public let identifier = "UILocalPlugin"
  public let jsName = "UILocal"
  
  private var call: CAPPluginCall?
  private var selectedDate: Date?
  
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "showDatePicker", returnType: CAPPluginReturnPromise)
  ]
  
  @objc func showDatePicker(_ call: CAPPluginCall) {
    self.call = call
    
    DispatchQueue.main.async { [weak self] in
      let datePicker = UIDatePicker()
      datePicker.datePickerMode = .date
      datePicker.preferredDatePickerStyle = .wheels
      datePicker.addTarget(self, action: #selector(self?.dateChanged(_:)), for: .valueChanged)
      
      // Create hosting view controller
      let viewController = UIViewController()
      viewController.view.backgroundColor = .white
      
      // Create the top toolbar (including cancel and confirm buttons)
      let toolbar = UIToolbar()
      toolbar.translatesAutoresizingMaskIntoConstraints = false
      let cancelButton = UIBarButtonItem(title: "Cancel", style: .plain, target: self, action: #selector(self?.cancelTapped))
      let doneButton = UIBarButtonItem(title: "Done", style: .done, target: self, action: #selector(self?.confirmTapped))
      let flexibleSpace = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
      toolbar.setItems([cancelButton, flexibleSpace, doneButton], animated: false)
      toolbar.sizeToFit()
      
      // Add date selector and toolbar to the view
      datePicker.translatesAutoresizingMaskIntoConstraints = false
      viewController.view.addSubview(datePicker)
      viewController.view.addSubview(toolbar)
      
      // Set layout constraints
      NSLayoutConstraint.activate([
        toolbar.topAnchor.constraint(equalTo: viewController.view.safeAreaLayoutGuide.topAnchor),
        toolbar.leadingAnchor.constraint(equalTo: viewController.view.leadingAnchor),
        toolbar.trailingAnchor.constraint(equalTo: viewController.view.trailingAnchor),
        
        datePicker.topAnchor.constraint(equalTo: toolbar.bottomAnchor, constant: 10),
        datePicker.leadingAnchor.constraint(equalTo: viewController.view.leadingAnchor),
        datePicker.trailingAnchor.constraint(equalTo: viewController.view.trailingAnchor),
        datePicker.bottomAnchor.constraint(lessThanOrEqualTo: viewController.view.safeAreaLayoutGuide.bottomAnchor, constant: -10)
      ])
      
      // Set bottom sheet style (compatible with iOS 13+)
      viewController.modalPresentationStyle = .formSheet
      viewController.isModalInPresentation = true
      
      // Present View Controller
      guard let presentingViewController = self?.bridge?.viewController else {
        call.reject("Unable to present date picker")
        return
      }
      presentingViewController.present(viewController, animated: true, completion: nil)
    }
  }
  
  @objc private func dateChanged(_ datePicker: UIDatePicker) {
    self.selectedDate = datePicker.date
    self.call?.keepAlive = true // Keep calling until confirmed or canceled
  }
  
  @objc private func confirmTapped() {
    if let date = self.selectedDate {
      let formatter = DateFormatter()
      formatter.dateFormat = "yyyy-MM-dd"
      let dateString = formatter.string(from: date)
      let result: PluginCallResultData = ["value": dateString]
      self.call?.resolve(result)
    } else {
      let formatter = DateFormatter()
      formatter.dateFormat = "yyyy-MM-dd"
      let dateString = formatter.string(from: Date())
      let result: PluginCallResultData = ["value": dateString]
      self.call?.resolve(result)
    }
    
    self.bridge?.viewController?.dismiss(animated: true, completion: nil)
  }
  
  @objc private func cancelTapped() {
    self.call?.reject("Date selection cancelled")
    self.bridge?.viewController?.dismiss(animated: true, completion: nil)
  }
  
  override public func load () {
    print("🔅 UILocalPlugin loaded")
  }
}
