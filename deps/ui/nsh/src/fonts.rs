//! The application's existing Inter faces, registered before the first layout.
use nsh_core::element::Root;

const INTER_FACES: [&[u8]; 9] = [
    include_bytes!("../../assets/fonts/Inter-Regular.ttf"),
    include_bytes!("../../assets/fonts/Inter-Italic.ttf"),
    include_bytes!("../../assets/fonts/Inter-Light.ttf"),
    include_bytes!("../../assets/fonts/Inter-Medium.ttf"),
    include_bytes!("../../assets/fonts/Inter-MediumItalic.ttf"),
    include_bytes!("../../assets/fonts/Inter-SemiBold.ttf"),
    include_bytes!("../../assets/fonts/Inter-SemiBoldItalic.ttf"),
    include_bytes!("../../assets/fonts/Inter-Bold.ttf"),
    include_bytes!("../../assets/fonts/Inter-BoldItalic.ttf"),
];

/// Share the native runner's exact font registration with startup qualification.
/// NSH owns registration and shaping; no application font cache is introduced.
pub fn with_bundled_fonts(mut root: Root) -> Root {
    for face in INTER_FACES {
        root = root.font(face);
    }
    root
}
