import { PreviewShell } from "@/builder/preview/preview-shell";

type PreviewPageProps = {
  searchParams: Promise<{ snapshot?: string | string[] }>;
};

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const snapshot = (await searchParams).snapshot;

  return <PreviewShell snapshotId={typeof snapshot === "string" ? snapshot : null} />;
}
