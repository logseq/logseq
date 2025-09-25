//
//  UILocal.swift
//  App
//
//  Created by Charlie on 2025/5/29.
//

import Capacitor
import Foundation
import Speech
import NaturalLanguage

func isDarkMode() -> Bool {
    if #available(iOS 12.0, *) {
        return UITraitCollection.current.userInterfaceStyle == .dark
    } else {
        return false
    }
}

func isOnlyDayDifferentOrSame(date1: Foundation.Date, date2: Date) -> Bool {
    let calendar = Calendar.current
    let components1 = calendar.dateComponents([.year, .month, .day], from: date1)
    let components2 = calendar.dateComponents([.year, .month, .day], from: date2)

    return components1.year == components2.year && components1.month == components2.month && (components1.day != components2.day || components1.day == components2.day)
}

class DatePickerView: UIView {
    override init(frame: CGRect) {
        super.init(frame: frame)
        isUserInteractionEnabled = true
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        isUserInteractionEnabled = true
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
    }
}

class DatePickerDialogViewController: UIViewController {
    private let datePicker = UIDatePicker()
    private let dialogView = DatePickerView()

    private var lastDate: Date?
    private var initialMonthLabel: UILabel?
    private var currentMonthText: String?

    var onDateSelected: ((Date?) -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        lastDate = datePicker.date
        setupImplView()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.settleMonthLabel()
        }
    }

    private func settleMonthLabel() {
        initialMonthLabel = findMonthLabel(in: datePicker)
        if let label = initialMonthLabel {
            currentMonthText = label.text
            print("Initial month label: \(currentMonthText ?? "Unknown")")
        } else {
            print("Month label not found")
        }
    }

    private func findMonthLabel(in view: UIView) -> UILabel? {
        for subview in view.subviews {
            if let label = subview as? UILabel, (label.text?.contains(" ")) == true {
                print(label.text as Any)
                return label
            }
            if let foundLabel = findMonthLabel(in: subview) {
                return foundLabel
            }
        }
        return nil
    }

    private func inCalendarWheelPickerMode(in view: UIView) -> Bool? {
        for subview in view.subviews {
            if let label = subview as? UILabel, label.text?.contains("July") == true {
                print(label.text as Any)
                return true
            }

            let found: Bool? = inCalendarWheelPickerMode(in: subview)

            if found == true {
                return true
            }
        }

        return false
    }


    @objc private func confirmDate() {
        let label = findMonthLabel(in: datePicker)
        if isOnlyDayDifferentOrSame(date1: lastDate!, date2: datePicker.date) || (label != nil && label?.text != currentMonthText && (inCalendarWheelPickerMode(in: datePicker) != true)) {
            onDateSelected?(datePicker.date)
            dismiss(animated: false, completion: nil)
        }
    }

    @objc private func dismissDialog() {
        onDateSelected?(nil)
        dismiss(animated: false, completion: nil)
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)

        if #available(iOS 12.0, *) {
            if traitCollection.userInterfaceStyle != previousTraitCollection?.userInterfaceStyle {
                if traitCollection.userInterfaceStyle == .dark {
                    print("switch to dark mode")
                    dialogView.backgroundColor = .black
                } else {
                    print("switch to light mode")
                    dialogView.backgroundColor = .white
                }
            }
        }
    }

    func setupImplView() {
        datePicker.datePickerMode = .date
        datePicker.preferredDatePickerStyle = .inline
        datePicker.addTarget(
          self, action: #selector(confirmDate), for: .valueChanged)

        // Create hosting view controller
        let view = self.view!

        view.backgroundColor = .black.withAlphaComponent(0.4)
        view.isUserInteractionEnabled = true

        if isDarkMode() {
            dialogView.backgroundColor = .black
        } else {
            dialogView.backgroundColor = .white
        }

        dialogView.layer.cornerRadius = 10
        dialogView.clipsToBounds = true
        view.addSubview(dialogView)

        dialogView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
                                      dialogView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
                                      dialogView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
                                    ])

        // Add sub views
        dialogView.addSubview(datePicker)

        // Add date selector and toolbar to the view
        datePicker.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
                                      datePicker.topAnchor.constraint(equalTo: dialogView.topAnchor),
                                      datePicker.bottomAnchor.constraint(equalTo: dialogView.bottomAnchor, constant: -8),
                                      datePicker.leadingAnchor.constraint(equalTo: dialogView.leadingAnchor, constant: 16),
                                      datePicker.trailingAnchor.constraint(equalTo: dialogView.trailingAnchor, constant: -16),
                                    ])

        datePicker.setContentHuggingPriority(.required, for: .horizontal)
        datePicker.setContentHuggingPriority(.required, for: .vertical)
        datePicker.setContentCompressionResistancePriority(
          .required, for: .horizontal)
        datePicker.setContentCompressionResistancePriority(
          .required, for: .vertical)
    }


    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)

        if let touch = touches.first {
            let location = touch.location(in: view)
            if !dialogView.frame.contains(location) {
                dismiss(animated: true, completion: nil)
            }
        }
    }
}

@objc(UILocalPlugin)
public class UILocalPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "UILocalPlugin"
    public let jsName = "UILocal"

    private var call: CAPPluginCall?
    private var selectedDate: Date?
    private var datepickerViewController: UIViewController?
    private var datepickerDialogView: UIView?

    public let pluginMethods: [CAPPluginMethod] = [
      CAPPluginMethod(name: "showDatePicker", returnType: CAPPluginReturnPromise),
      CAPPluginMethod(name: "transcribeAudio2Text", returnType: CAPPluginReturnPromise)
    ]

@available(iOS 26.0, *)
func recognizeWithAutoLocale(from file: URL,
                             completion: @escaping (String?, Error?) -> Void) {
  Task {
    do {
      // ---------- STEP 1: Gather candidate locales ----------
      let preferred = Array(Locale.preferredLanguages.prefix(3))
      var candidateIDs = preferred
      if !candidateIDs.contains(where: { $0.hasPrefix("en") }) {
        candidateIDs.append("en-US")
      }
      if !candidateIDs.contains(where: { $0.hasPrefix("zh") }) {
        candidateIDs.append("zh-CN")
      }

      // ---------- STEP 2: Probe candidates in parallel ----------
      var results: [(Locale, String)] = []

      await withTaskGroup(of: (Locale, String).self) { group in
        for id in candidateIDs {
          let candidate = Locale(identifier: id)
          if let supported = await SpeechTranscriber.supportedLocale(equivalentTo: candidate) {
            group.addTask {
                let text = (try? await self.quickSampleTranscription(file: file, locale: supported)) ?? ""
              return (supported, text)
            }
          }
        }
        for await (locale, text) in group {
          results.append((locale, text))
        }
      }

      // ---------- STEP 3: Score results ----------
      var bestLocale: Locale = Locale(identifier: "en-US")
      var bestScore = Int.min
      for (locale, text) in results {
        let score = scoreTranscript(text, locale: locale)
        print("📊 Candidate: \(locale.identifier), score: \(score), text: \(text)")
        if score > bestScore {
          bestScore = score
          bestLocale = locale
        }
      }

      print("🎙 Running full transcription with locale: \(bestLocale.identifier)")

      // ---------- STEP 4: Full transcription ----------
      let transcriber = SpeechTranscriber(locale: bestLocale, preset: .transcription)

      if let req = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
        try await req.downloadAndInstall()
        print("✅ Model installed for \(bestLocale.identifier)")
      }

      let collectFullTask = Task { () -> String in
        var full = ""
        do {
          for try await r in transcriber.results {
            full += String(r.text.characters) + " "
          }
        } catch {}
        return full
      }

      let analyzer = SpeechAnalyzer(modules: [transcriber])
      let audio = try AVAudioFile(forReading: file)
      if let last = try await analyzer.analyzeSequence(from: audio) {
        try await analyzer.finalizeAndFinish(through: last)
      } else {
        try await analyzer.cancelAndFinishNow()
      }

      let finalText = (await collectFullTask.value)
        .trimmingCharacters(in: .whitespacesAndNewlines)

      completion(finalText.isEmpty ? nil : finalText, nil)

    } catch {
      completion(nil, error)
    }
  }
}

@available(iOS 26.0, *)
private func quickSampleTranscription(file: URL, locale: Locale) async throws -> String {
  let transcriber = SpeechTranscriber(locale: locale, preset: .transcription)

  // Install models if needed (you could cache this across runs)
  if let req = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
    try await req.downloadAndInstall()
  }

  var sample = ""
  var count = 0
  let analyzer = SpeechAnalyzer(modules: [transcriber])

  let collectTask = Task { () -> String in
    do {
      for try await r in transcriber.results {
        sample += String(r.text.characters) + " "
        count += 1
        if count >= 3 {
          // ✅ Early exit: stop once we have enough
          try? await analyzer.cancelAndFinishNow()
          break
        }
      }
    } catch {}
    return sample
  }

  let audioFile = try AVAudioFile(forReading: file)
  if let last = try await analyzer.analyzeSequence(from: audioFile) {
    try await analyzer.finalizeAndFinish(through: last)
  } else {
    try await analyzer.cancelAndFinishNow()
  }

  return await collectTask.value.trimmingCharacters(in: .whitespacesAndNewlines)
}

private func scoreTranscript(_ text: String, locale: Locale) -> Int {
  // Normalize: keep only letters/digits/scripts (ignore punctuation)
  let normalized = text.unicodeScalars.filter {
    CharacterSet.letters.contains($0) ||
    CharacterSet.decimalDigits.contains($0) ||
    CharacterSet(charactersIn: "\u{4E00}"..."\u{9FFF}").contains($0) || // Han
    CharacterSet(charactersIn: "\u{3040}"..."\u{30FF}").contains($0) || // Kana
    CharacterSet(charactersIn: "\u{AC00}"..."\u{D7AF}").contains($0) || // Hangul
    CharacterSet(charactersIn: "\u{0400}"..."\u{04FF}").contains($0) || // Cyrillic
    CharacterSet(charactersIn: "\u{0600}"..."\u{06FF}").contains($0) || // Arabic
    CharacterSet(charactersIn: "\u{0590}"..."\u{05FF}").contains($0) || // Hebrew
    CharacterSet(charactersIn: "\u{0900}"..."\u{097F}").contains($0)    // Devanagari
  }
  let coreText = String(String.UnicodeScalarView(normalized))
  var score = coreText.count

  // Detect script presence
  let hasHan      = coreText.range(of: #"\p{Han}"#, options: .regularExpression) != nil
  let hasKana     = coreText.range(of: #"\u3040-\u30FF"#, options: .regularExpression) != nil
  let hasHangul   = coreText.range(of: #"\uAC00-\uD7AF"#, options: .regularExpression) != nil
  let hasCyrillic = coreText.range(of: #"\u0400-\u04FF"#, options: .regularExpression) != nil
  let hasArabic   = coreText.range(of: #"\u0600-\u06FF"#, options: .regularExpression) != nil
  let hasHebrew   = coreText.range(of: #"\u0590-\u05FF"#, options: .regularExpression) != nil
  let hasDevanag  = coreText.range(of: #"\u0900-\u097F"#, options: .regularExpression) != nil

  // Latin ratio detection
  let latinLetters = coreText.filter { $0.isASCII && $0.isLetter }.count
  let latinRatio = coreText.isEmpty ? 0.0 : Double(latinLetters) / Double(coreText.count)

  if latinRatio > 0.7 {
    if locale.identifier.hasPrefix("en") {
      score += 500
    } else if locale.identifier.hasPrefix("zh")
           || locale.identifier.hasPrefix("ja")
           || locale.identifier.hasPrefix("ko") {
      score -= 500
    }
  }

  if hasHan      { score += locale.identifier.hasPrefix("zh") || locale.identifier.hasPrefix("ja") ? 1000 : -500 }
  if hasKana     { score += locale.identifier.hasPrefix("ja") ? 1000 : -500 }
  if hasHangul   { score += locale.identifier.hasPrefix("ko") ? 1000 : -500 }
  if hasCyrillic { score += locale.identifier.hasPrefix("ru") ? 1000 : -500 }
  if hasArabic   { score += locale.identifier.hasPrefix("ar") ? 1000 : -500 }
  if hasHebrew   { score += locale.identifier.hasPrefix("he") ? 1000 : -500 }
  if hasDevanag  { score += locale.identifier.hasPrefix("hi") ? 1000 : -500 }

  // Bias toward user-preferred languages
  if Locale.preferredLanguages.contains(where: { locale.identifier.hasPrefix($0.prefix(2)) }) {
    score += 200
  }

  return score
}


    @available(iOS 26.0, *)
    @objc func transcribeAudio2Text(_ call: CAPPluginCall) {
        self.call = call

        // audio arrayBuffer
        guard let audioArray = call.getArray("audioData", NSNumber.self) as? [UInt8] else {
            call.reject("invalid audioData")
            return
        }

        let audioData = Data(audioArray)

        let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent("recordedAudio.m4a")

        do {
            try audioData.write(to: fileURL)

            let fileExists = FileManager.default.fileExists(atPath: fileURL.path)

            print("file exists: \(fileExists), path: \(fileURL.path)")
            if !fileExists {
                call.reject("file save failed: file doesn't exist")
                return
            }

            self.recognizeWithAutoLocale(from: fileURL) { result, error in
                if let result = result {
                    call.resolve(["transcription": result])
                } else if let error = error {
                    call.reject("failed to transcribe: \(error.localizedDescription)")
                }
            }
        } catch {
            call.reject("failed to transcribe: \(error.localizedDescription)")
        }
    }

    @objc func showDatePicker(_ call: CAPPluginCall) {
        self.call = call

        DispatchQueue.main.async { [weak self] in
            let viewController = DatePickerDialogViewController()

            // Set view controller presentation
            viewController.modalPresentationStyle = .overFullScreen
            viewController.modalTransitionStyle = .crossDissolve
            viewController.isModalInPresentation = true  // 禁止非按钮交互关闭

            viewController.onDateSelected = self?.dateChanged

            // Present View Controller
            guard let presentingViewController = self?.bridge?.viewController else {
                call.reject("Unable to present date picker")
                return
            }

            presentingViewController.present(
              viewController, animated: false, completion: nil)
        }
    }

    private func dateChanged(_ date: Date?) {
        self.selectedDate = date
        self.call?.keepAlive = true  // Keep calling until confirmed or canceled
        onDateSelected()
    }

    private func onDateSelected() {
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

    override public func load() {
        print("🔅 UILocalPlugin loaded")
    }
}
