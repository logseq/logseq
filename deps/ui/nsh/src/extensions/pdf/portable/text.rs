//! Bounded logical text, independent of rendering, OS handles and PDFium borrows.
use std::ops::Range;
use unicode_segmentation::UnicodeSegmentation;

const MAX_CHARS: usize = 2_000_000;
const MAX_PAGES: usize = 100_000;
#[derive(Clone, Copy, Debug)]
pub enum Unit {
    Character,
    Word,
    Line,
    Page,
    Document,
}
#[derive(Debug)]
pub struct Page {
    pub number: usize,
    pub start: usize,
    pub end: usize,
    pub first_glyph: usize,
}
#[derive(Default)]
pub struct Builder {
    text: String,
    chars: usize,
    pages: Vec<Page>,
}
pub struct Document {
    text: String,
    offsets: Vec<u32>,
    characters: Vec<u32>,
    words: Vec<u32>,
    lines: Vec<u32>,
    page_units: Vec<u32>,
    document: [u32; 2],
    pub pages: Vec<Page>,
}
impl Builder {
    pub fn append(
        &mut self,
        page: usize,
        first_glyph: usize,
        chars: impl IntoIterator<Item = char>,
    ) -> Result<(), String> {
        if self.pages.len() >= MAX_PAGES || page != self.pages.len() + 1 {
            return Err("PDF accessible pages must be consecutive and bounded".into());
        }
        // Stage before committing: invalid/over-budget input cannot leave a
        // partially appended page in the builder.
        let mut chunk = String::new();
        let mut count = 0;
        let separator = usize::from(!self.pages.is_empty());
        for character in chars {
            count += 1;
            if self.chars + separator + count > MAX_CHARS {
                return Err("PDF accessible text exceeds its character budget".into());
            }
            chunk.push(character);
        }
        first_glyph
            .checked_add(count)
            .ok_or("PDF glyph range overflowed")?;
        if separator != 0 {
            self.text.push('\u{000c}');
            self.chars += 1;
        }
        let start = self.chars;
        self.text.push_str(&chunk);
        self.chars += count;
        self.pages.push(Page {
            number: page,
            start,
            end: self.chars,
            first_glyph,
        });
        Ok(())
    }
    pub fn finish(self) -> Result<Document, String> {
        if self.pages.is_empty() {
            return Err("PDF accessible text requires a complete page sequence".into());
        }
        let mut offsets: Vec<u32> = self
            .text
            .char_indices()
            .map(|(index, _)| index as u32)
            .collect();
        offsets.push(self.text.len() as u32);
        let boundaries = |chunks: &mut dyn Iterator<Item = &str>| {
            let mut count = 0;
            let mut output = vec![0];
            for chunk in chunks {
                count += chunk.chars().count();
                output.push(count as u32);
            }
            output
        };
        let characters = boundaries(&mut self.text.graphemes(true));
        let words = boundaries(&mut self.text.split_word_bounds());
        let mut lines = vec![0];
        for (index, character) in self.text.chars().enumerate() {
            if matches!(character, '\n' | '\u{000c}') {
                lines.push((index + 1) as u32);
            }
        }
        if lines.last() != Some(&(self.chars as u32)) {
            lines.push(self.chars as u32);
        }
        let mut page_units: Vec<u32> = self.pages.iter().map(|page| page.start as u32).collect();
        page_units.push(self.chars as u32);
        page_units.dedup();
        Ok(Document {
            text: self.text,
            offsets,
            characters,
            words,
            lines,
            page_units,
            document: [0, self.chars as u32],
            pages: self.pages,
        })
    }
}
impl Document {
    pub fn len(&self) -> usize {
        self.offsets.len() - 1
    }
    pub fn valid(&self, range: &Range<usize>) -> bool {
        range.start <= range.end && range.end <= self.len()
    }
    pub fn slice(&self, range: Range<usize>) -> Result<&str, String> {
        if !self.valid(&range) {
            return Err("PDF logical range is outside its document".into());
        }
        Ok(&self.text[self.offsets[range.start] as usize..self.offsets[range.end] as usize])
    }
    pub fn utf16(&self, range: Range<usize>, max: Option<usize>) -> Result<Vec<u16>, String> {
        let mut result = Vec::new();
        for character in self.slice(range)?.chars() {
            if max.is_some_and(|max| result.len() + character.len_utf16() > max) {
                break;
            }
            result.extend_from_slice(character.encode_utf16(&mut [0; 2]));
        }
        Ok(result)
    }
    pub fn units(&self, unit: Unit) -> &[u32] {
        match unit {
            Unit::Character => &self.characters,
            Unit::Word => &self.words,
            Unit::Line => &self.lines,
            Unit::Page => &self.page_units,
            Unit::Document => &self.document,
        }
    }
    pub fn enclosing(&self, offset: usize, unit: Unit) -> Range<usize> {
        let bounds = self.units(unit);
        if self.len() == 0 || bounds.len() < 2 {
            return 0..0;
        }
        let index = bounds
            .partition_point(|bound| *bound as usize <= offset)
            .saturating_sub(1)
            .min(bounds.len() - 2);
        bounds[index] as usize..bounds[index + 1] as usize
    }
    pub fn move_endpoint(&self, offset: usize, unit: Unit, count: i32) -> (usize, i32) {
        let bounds = self.units(unit);
        if count >= 0 {
            let first = bounds.partition_point(|bound| *bound as usize <= offset);
            let steps = (count as usize).min(bounds.len() - first);
            (
                if steps == 0 {
                    offset
                } else {
                    bounds[first + steps - 1] as usize
                },
                steps as i32,
            )
        } else {
            let before = bounds.partition_point(|bound| (*bound as usize) < offset);
            let steps = (count.unsigned_abs() as usize).min(before);
            (
                if steps == 0 {
                    offset
                } else {
                    bounds[before - steps] as usize
                },
                -(steps as i32),
            )
        }
    }
    pub fn move_range(&self, range: Range<usize>, unit: Unit, count: i32) -> (Range<usize>, i32) {
        if range.is_empty() {
            let (offset, moved) = self.move_endpoint(range.start, unit, count);
            return (offset..offset, moved);
        }
        let bounds = self.units(unit);
        if bounds.len() < 2 {
            return (0..0, 0);
        }
        let index = bounds
            .partition_point(|bound| *bound as usize <= range.start)
            .saturating_sub(1)
            .min(bounds.len() - 2);
        let next = (index as i64 + i64::from(count)).clamp(0, bounds.len() as i64 - 2) as usize;
        (
            bounds[next] as usize..bounds[next + 1] as usize,
            next as i32 - index as i32,
        )
    }
    /// Map a UIA logical range back to the existing per-page glyph-index owner.
    pub fn page_ranges(&self, range: Range<usize>) -> Result<Vec<(usize, Range<usize>)>, String> {
        if !self.valid(&range) {
            return Err("PDF logical selection is outside its document".into());
        }
        Ok(self
            .pages
            .iter()
            .filter_map(|page| {
                let start = range.start.max(page.start);
                let end = range.end.min(page.end);
                (start < end).then(|| {
                    (
                        page.number,
                        page.first_glyph + start - page.start..page.first_glyph + end - page.start,
                    )
                })
            })
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn unicode_units_and_full_document_ranges_do_not_follow_utf8_or_surrogate_bytes() {
        let mut builder = Builder::default();
        builder
            .append(1, 42, "a😀e\u{301} 中\nnext".chars())
            .unwrap();
        builder.append(2, 0, "second".chars()).unwrap();
        let doc = builder.finish().unwrap();
        assert_eq!(doc.slice(1..2).unwrap(), "😀");
        assert_eq!(
            doc.enclosing(3, Unit::Character),
            2..4,
            "combining grapheme remains one native character unit"
        );
        assert_eq!(
            doc.utf16(1..2, Some(1)).unwrap(),
            Vec::<u16>::new(),
            "UTF-16 length cannot split a surrogate pair"
        );
        assert_eq!(
            doc.utf16(1..2, Some(2)).unwrap(),
            "😀".encode_utf16().collect::<Vec<_>>()
        );
        assert!(doc.slice(0..doc.len()).unwrap().contains("\u{c}second"));
        assert_eq!(doc.page_ranges(1..4).unwrap(), vec![(1, 43..46)]);
        let second = doc.pages[1].start;
        assert_eq!(doc.enclosing(second, Unit::Page), second..doc.len());
        assert_eq!(doc.move_endpoint(0, Unit::Character, -4), (0, 0));
        assert_eq!(doc.move_endpoint(0, Unit::Character, 2), (2, 2));
        assert_eq!(doc.move_range(0..4, Unit::Page, 1), (second..doc.len(), 1));
        assert_eq!(doc.enclosing(second, Unit::Word), second..doc.len());
        assert_eq!(doc.enclosing(0, Unit::Line), 0..7);
    }
    #[test]
    fn failed_append_is_atomic_and_large_or_unordered_documents_are_explicit_errors() {
        let mut builder = Builder::default();
        builder.append(1, 0, "one".chars()).unwrap();
        assert!(builder.append(3, 0, "wrong".chars()).is_err());
        assert!(
            builder
                .append(2, 0, std::iter::repeat_n('x', MAX_CHARS))
                .is_err()
        );
        builder.append(2, 7, "two".chars()).unwrap();
        let doc = builder.finish().unwrap();
        assert_eq!(doc.slice(0..doc.len()).unwrap(), "one\u{c}two");
        assert!(doc.slice(0..doc.len() + 1).is_err());
        let empty = Builder::default().finish();
        assert!(empty.is_err());
    }
}
