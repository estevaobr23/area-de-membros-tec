import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/auth/session";
import { getManualAccess } from "@/lib/data/manual";
import { PdfViewer } from "@/components/reader/pdf-viewer-loader";

export default async function LeitorPage({
  params,
}: PageProps<"/produtos/[slug]/leitor">) {
  const customer = await requireCustomer();
  const { slug } = await params;

  const access = await getManualAccess(customer.id, slug);
  if (!access) notFound();

  return (
    <PdfViewer
      fileUrl={access.signedUrl}
      downloadUrl={access.downloadUrl}
      productId={access.product.id}
      productName={access.product.name}
      backHref="/produtos"
      initialPage={access.lastPage}
    />
  );
}
