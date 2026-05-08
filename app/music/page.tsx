import CategoryNotes from "@/components/CategoryNotes";

export default function MusicPage() {
  return (
    <CategoryNotes
      categoryKey="music"
      category={{
        label: "음악",
        prompt: "어떤 음악을 들었나요?",
        mood: "LP판 위에 마음을 올려두는 곳",
        placeholder: "어떤 음악을 들었나요?",
      }}
    />
  );
}
