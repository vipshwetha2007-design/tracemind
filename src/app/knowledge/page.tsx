import KnowledgeView from "@/components/knowledge/KnowledgeView";
import { getAllKnowledgeSources } from "@/lib/queries";

export default async function KnowledgePage() {
  const sources = await getAllKnowledgeSources();
  return <KnowledgeView sources={sources} />;
}
