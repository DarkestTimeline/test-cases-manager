import { notFound } from "next/navigation";
import Playground from "./Playground";

export const metadata = { title: "Rich text playground" };

// Throwaway page for trying the rich text components. It is switched off in
// production and gets deleted once rich text is used for real.
export default function RichTextPlaygroundPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <h1>Rich text playground</h1>
      <Playground />
    </main>
  );
}
