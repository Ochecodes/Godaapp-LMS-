import { describe, expect, it } from "vitest";
import { splitLessonContent, type LessonContent } from "./lesson-content";

function createContent(blockCount: number): LessonContent {
  return {
    root: {
      type: "root",
      children: Array.from({ length: blockCount }, (_, index) => ({
        type: "paragraph",
        version: 1,
        children: [{ type: "text", version: 1, text: `Lesson block ${index + 1}` }],
      })),
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

describe("splitLessonContent", () => {
  it("groups lesson blocks into readable slides without losing editor data", () => {
    const content = createContent(7);
    const slides = splitLessonContent(content);

    expect(slides.map((slide) => slide.root.children)).toHaveLength(3);
    expect(slides.map((slide) => slide.root.children.length)).toEqual([3, 3, 1]);
    expect(slides[0].root.direction).toBe("ltr");
    expect(slides.flatMap((slide) => slide.root.children)).toEqual(content.root.children);
  });

  it("starts a new slide before an oversized group of paragraphs", () => {
    const content = createContent(2);
    const longParagraph = {
      ...content.root.children[0],
      children: [{ type: "text", version: 1, text: "word ".repeat(230) }],
    };
    const slides = splitLessonContent({
      ...content,
      root: { ...content.root, children: [longParagraph, content.root.children[1]] },
    });

    expect(slides).toHaveLength(2);
    expect(slides[0].root.children).toHaveLength(1);
    expect(slides[1].root.children).toHaveLength(1);
  });

  it("returns no slides for an empty lesson", () => {
    expect(splitLessonContent(null)).toEqual([]);
    expect(splitLessonContent({ ...createContent(0) })).toEqual([]);
  });
});
