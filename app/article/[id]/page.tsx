import { ArticleDetailScreen } from "@/features/ArticleDetailScreen";

type ArticleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const { id } = await params;

  return <ArticleDetailScreen articleId={id} />;
}
