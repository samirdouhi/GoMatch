import { getAllMatches } from "@/lib/matchesApi";
import MatchesPageClient from "../components/matches/MatchesPageClient";

export default async function MatchesPage() {
  const matches = await getAllMatches();

  return <MatchesPageClient initialMatches={matches} />;
}