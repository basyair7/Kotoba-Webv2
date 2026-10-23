interface GreetPageProps {
  params: Promise<{ name: string }>;
}

export default async function GreetPage({ params }: GreetPageProps) {
  const { name } = await params;
  return <div>こんにちは！ {name}</div>;
}
