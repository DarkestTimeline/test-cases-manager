import { redirect } from "next/navigation";

// The Projects page is the first screen.
export default function Home() {
  redirect("/projects");
}
