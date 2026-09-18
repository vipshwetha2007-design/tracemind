import DecisionsView from "@/components/decisions/DecisionsView";
import { getAllDecisions } from "@/lib/queries";

export default async function DecisionsPage() {
  const decisions = await getAllDecisions();
  return <DecisionsView decisions={decisions} />;
}
