import AiChat from "@/components/AiChat";

export default async function AiChatPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;

  return <AiChat noteId={noteId} />;
}
