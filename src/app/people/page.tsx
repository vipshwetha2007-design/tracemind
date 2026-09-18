import PageHeader from "@/components/shared/PageHeader";
import PersonCard from "@/components/people/PersonCard";
import { getAllPeople } from "@/lib/queries";

export default async function PeoplePage() {
  const people = await getAllPeople();

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="The people behind your organization's decisions and knowledge."
      />

      {people.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted">No people yet.</p>
        </div>
      )}
    </div>
  );
}
