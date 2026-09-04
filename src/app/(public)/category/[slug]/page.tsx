import { getDb } from '@/data/db';
import { generateSlug } from '@/utils/slugs';
import { notFound, redirect } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ sub?: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const db = await getDb();
  
  const categoryInfo = db.sections.find(s => 
    s.type === 'products_by_category' && generateSlug(s.title) === decodedSlug
  );

  if (!categoryInfo) return { title: 'Category Not Found' };

  return {
    title: `${categoryInfo.title} | بكام النهاردة`,
    description: `اكتشف وقارن أفضل أسعار وعروض ${categoryInfo.title} في مصر على بكام النهاردة.`,
    alternates: {
      canonical: `/category/${resolvedParams.slug}`,
    },
    openGraph: {
      title: `${categoryInfo.title} | بكام النهاردة`,
      description: `اكتشف وقارن أفضل أسعار وعروض ${categoryInfo.title} في مصر على بكام النهاردة.`,
      url: `/category/${resolvedParams.slug}`,
    }
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ sub?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  
  const db = await getDb();

  const categoryInfo = db.sections.find(s => 
    s.type === 'products_by_category' && generateSlug(s.title) === decodedSlug
  );

  if (!categoryInfo || !categoryInfo.category) {
    notFound();
  }

  const categoryName = categoryInfo.title;
  
  // Include child categories
  const childSections = db.sections.filter(c => c.parentId === categoryInfo.category).sort((a, b) => (a.order || 0) - (b.order || 0));
  const childCats = childSections.map(c => c.category);
  
  // If a subcategory tab is active, only show that subcategory's products. Otherwise, show parent + all children.
  let validCats = [categoryInfo.category, ...childCats];
  
  if (resolvedSearchParams.sub) {
    const subCatInfo = db.sections.find(s => generateSlug(s.title) === resolvedSearchParams.sub);
    if (subCatInfo && subCatInfo.category) {
      validCats = [subCatInfo.category];
    }
  }

  const filtered = db.products.filter(p => p.category && validCats.includes(p.category));

  return (
    <div className="container animate-fade-in">
      <section className="section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <h2 className="text-2xl" style={{ marginBottom: '1.5rem' }}>
          {categoryName}
        </h2>

        {childSections.length > 0 && (
          <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }} className="hide-scrollbar">
            <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; }`}} />
            <Link
              href={`/category/${resolvedParams.slug}`}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '2rem',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                fontSize: '0.95rem',
                background: !resolvedSearchParams.sub ? 'var(--accent-color)' : 'var(--surface-color)',
                color: !resolvedSearchParams.sub ? 'white' : 'var(--text-color)',
                border: `1.5px solid ${!resolvedSearchParams.sub ? 'var(--accent-color)' : 'var(--border-color)'}`,
                transition: 'all 0.2s ease',
                boxShadow: !resolvedSearchParams.sub ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              الكل
            </Link>
            {childSections.map(child => {
              const childSlug = generateSlug(child.title);
              const isActive = resolvedSearchParams.sub === childSlug;
              return (
                <Link
                  key={child.id}
                  href={`/category/${resolvedParams.slug}?sub=${childSlug}`}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '2rem',
                    whiteSpace: 'nowrap',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    background: isActive ? 'var(--accent-color)' : 'var(--surface-color)',
                    color: isActive ? 'white' : 'var(--text-color)',
                    border: `1.5px solid ${isActive ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            لا توجد منتجات في هذا القسم حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
