import KotobaList from "../../components/KotobaList";

export default function TestPage() {
  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold mb-4">📚 Kotoba List</h1>
      <KotobaList lang="id" />
    </main>
  );
}
