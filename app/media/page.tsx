import CategoryNotes from "@/components/CategoryNotes";

export default function MediaPage() {
  return (
    <CategoryNotes
      categoryKey="media"
      category={{
        label: "미디어",
        prompt: "",
        mood: "책장 사이에 감상을 끼워두는 곳",
        placeholder: "어떤 책이나 콘텐츠를 봤나요?",
      }}
    />
  );
}
