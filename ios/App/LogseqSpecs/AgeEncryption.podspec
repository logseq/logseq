Pod::Spec.new do |s|
    s.name             = "AgeEncryption"
    s.version          = "1.0.6"
    s.summary          = "AgeEncryption for Logseq"
    s.description      = <<-DESC
                         TODO: Add description
                         DESC
    s.homepage         = "https://github.com/andelf/AgeEncryption"
    s.license          = 'MIT'
    s.author           = { "Andelf" => "andelf@gmail.com" }
    s.source           = { :http => "https://github.com/andelf/AgeEncryption/releases/download/#{s.version}/AgeEncryption.xcframework.zip" }

    s.requires_arc          = true

    s.platform = :ios
    s.ios.deployment_target = '12.0'

    s.vendored_frameworks = "AgeEncryption.xcframework"
    s.static_framework = true

    s.swift_version = '5.1'
  end
