import CategoryNotes from "@/components/CategoryNotes";

export default function VideoPage() {
  return (
    <CategoryNotes
      categoryKey="video"
      category={{
        label: "영상",
        prompt: "",
        mood: "작은 화면에서 오래 남은 장면을 꺼내는 곳",
        placeholder: "어떤 영화를 봤나요?",
      }}
    />
  );
}
