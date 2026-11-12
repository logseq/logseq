//! Own partially built UIA SAFEARRAYs; transfer ownership only on success.
use nsh_platform_windows::windows::{
    Win32::{
        Foundation::E_OUTOFMEMORY,
        System::{
            Com::SAFEARRAY,
            Ole::{SafeArrayCreateVector, SafeArrayDestroy, SafeArrayPutElement},
            Variant::{VARENUM, VT_R8, VT_UNKNOWN},
        },
        UI::Accessibility::ITextRangeProvider,
    },
    core::{Error, IUnknown, Interface, Result},
};
use std::ptr::NonNull;
struct Array(Option<NonNull<SAFEARRAY>>);
impl Array {
    fn new(kind: VARENUM, count: usize) -> Result<Self> {
        let count = u32::try_from(count).map_err(|_| Error::from_hresult(E_OUTOFMEMORY))?;
        // SAFETY: an owned one-dimensional automation array of the stated type.
        let pointer = unsafe { SafeArrayCreateVector(kind, 0, count) };
        Ok(Self(Some(
            NonNull::new(pointer).ok_or_else(|| Error::from_hresult(E_OUTOFMEMORY))?,
        )))
    }
    fn pointer(&self) -> *mut SAFEARRAY {
        self.0.expect("owned automation array").as_ptr()
    }
    fn finish(mut self) -> *mut SAFEARRAY {
        self.0.take().expect("owned automation array").as_ptr()
    }
}
impl Drop for Array {
    fn drop(&mut self) {
        if let Some(pointer) = self.0.take() {
            // SAFETY: only this wrapper owns this unlocked array. PutElement
            // pairs its internal locks; transferred arrays never reach Drop.
            unsafe { SafeArrayDestroy(pointer.as_ptr()) }
                .expect("owned UIA array remains unlocked");
        }
    }
}
pub fn ranges(values: &[ITextRangeProvider]) -> Result<*mut SAFEARRAY> {
    let array = Array::new(VT_UNKNOWN, values.len())?;
    for (index, value) in values.iter().enumerate() {
        let value: IUnknown = value.cast()?;
        // SAFETY: VT_UNKNOWN accepts the interface pointer itself, not another
        // pointer indirection, and PutElement AddRefs its copied interface.
        unsafe {
            SafeArrayPutElement(array.pointer(), &(index as i32), value.as_raw())?;
        }
    }
    Ok(array.finish())
}
pub fn rectangles(values: &[[f64; 4]]) -> Result<*mut SAFEARRAY> {
    let array = Array::new(VT_R8, values.len() * 4)?;
    for (index, value) in values.iter().flatten().enumerate() {
        // SAFETY: this array holds f64/VT_R8; the value is copied before return.
        unsafe {
            SafeArrayPutElement(
                array.pointer(),
                &(index as i32),
                std::ptr::from_ref(value).cast(),
            )?;
        }
    }
    Ok(array.finish())
}
