import type { Lesson } from "../../payload-types";

export type LessonContent = NonNullable<Lesson["contentBody"]>;

const MAX_BLOCKS_PER_SLIDE = 3;
const MAX_WORDS_PER_SLIDE = 220;

function countWords(value: unknown): number {
  if (typeof value === "string") {
    return value.trim().split(/\s+/).filter(Boolean).length;
  }

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countWords(item), 0);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).reduce((total, item) => total + countWords(item), 0);
  }

  return 0;
}

export function splitLessonContent(content: LessonContent | null | undefined): LessonContent[] {
  const blocks = content?.root.children;
  if (!content || !blocks?.length) return [];

  const slides: LessonContent[] = [];
  let slideBlocks: typeof blocks = [];
  let slideWordCount = 0;

  const addSlide = () => {
    if (!slideBlocks.length) return;
    slides.push({
      ...content,
      root: {
        ...content.root,
        children: slideBlocks,
      },
    });
    slideBlocks = [];
    slideWordCount = 0;
  };

  for (const block of blocks) {
    const blockWordCount = countWords(block);
    if (
      slideBlocks.length > 0 &&
      (slideBlocks.length >= MAX_BLOCKS_PER_SLIDE ||
        slideWordCount + blockWordCount > MAX_WORDS_PER_SLIDE)
    ) {
      addSlide();
    }

    slideBlocks.push(block);
    slideWordCount += blockWordCount;
  }

  addSlide();
  return slides;
}
