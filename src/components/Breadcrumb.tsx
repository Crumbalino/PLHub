import Link from 'next/link'
import { JsonLd, breadcrumbSchema } from './JsonLd'

interface BreadcrumbItem {
  name: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const baseUrl = 'https://pl-hub-webapp12.vercel.app'
  const schema = breadcrumbSchema(
    items.map((item) => ({
      name: item.name,
      url: `${baseUrl}${item.href}`,
    }))
  )

  return (
    <>
      <JsonLd data={schema} />
      <nav aria-label="Breadcrumb" className="text-sm text-white">
        <ol className="flex items-center gap-2">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">›</span>}
              {index === items.length - 1 ? (
                <span className="text-white" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-white"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
