import { getProject } from "@/lib/project";

// Tab titles inside a project read "Runs · DEMO · QA Test Manager".
export async function generateMetadata({ params }) {
  const { code } = await params;
  const project = await getProject(code);
  return {
    title: {
      default: `${project.name} · QA Test Manager`,
      template: `%s · ${project.code} · QA Test Manager`,
    },
  };
}

// Unknown project codes 404 here. The sidebar itself lives in the root layout.
export default async function ProjectLayout({ children, params }) {
  const { code } = await params;
  const project = await getProject(code);

  return (
    <>
      {project.archived_at && (
        <p
          role="status"
          className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800"
        >
          This project is archived. You can still browse it, but new items
          cannot be added.
        </p>
      )}
      {children}
    </>
  );
}
