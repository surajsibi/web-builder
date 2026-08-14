import { ProjectEditorLoader } from "@/builder/persistence/project-editor-loader";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  return <ProjectEditorLoader projectId={projectId} />;
}
