'use client';
import Link from 'next/link';
import { useProducts } from '../../hooks/useProducts';
import { Card, Button } from '../ui';

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-blue-50 text-blue-700',
  key: 'bg-emerald-50 text-emerald-700',
  design: 'bg-violet-50 text-violet-700',
  analytics: 'bg-amber-50 text-amber-700',
};

export function ProductsTab() {
  const { product, loading } = useProducts();

  // ── Loading state ──
  if (loading) return (
    <div className="space-y-8 animate-slide-up">
      <div className="bg-white/75 border border-brand-brown/10 rounded-3xl p-8 animate-pulse">
        <div className="h-4 bg-brand-brown/10 rounded-full w-1/4 mx-auto mb-4" />
        <div className="h-8 bg-brand-brown/10 rounded-full w-2/3 mx-auto mb-3" />
        <div className="h-4 bg-brand-brown/10 rounded-full w-1/2 mx-auto" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/75 border border-brand-brown/10 rounded-3xl p-6 h-40 animate-pulse" />
        ))}
      </div>
    </div>
  );

  // ── No product yet ──
  if (!product) return (
    <div className="space-y-8 animate-slide-up">
      <Card padding="lg" className="text-center">
        <p className="text-sm text-brand-brown/50 italic">No product info added yet.</p>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up">

      {/* ── Header ── */}
      <Card padding="lg" className="text-center">
        <p className="text-xs font-bold text-brand-light uppercase tracking-widest mb-3">Platform</p>
        <h2 className="text-3xl sm:text-4xl font-black text-brand-brown mb-4 leading-tight font-display">
          {product.name}
        </h2>
        <p className="text-base text-brand-brown/70 max-w-xl mx-auto leading-relaxed mb-2">
          {product.tagline}
        </p>
        <p className="text-sm text-brand-brown/55 max-w-2xl mx-auto leading-relaxed">
          {product.description}
        </p>
        {product.demoLink && (
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <Link
              href={product.demoLink}
              target="_blank"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-brown text-brand-cream text-sm font-semibold rounded-2xl hover:bg-brand-brown/90 transition-all shadow-md"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Live Demo
            </Link>
          </div>
        )}
      </Card>

      {/* ── Features grid ── */}
      {product.features.length > 0 && (
        <div>
          <p className="text-xs font-bold text-brand-brown/50 uppercase tracking-widest mb-4">
            Features
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {product.features.map((feature, idx) => (
              <Card key={idx} hoverable padding="lg" className="group">
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-brand-brown">{feature.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[feature.category] ?? 'bg-brand-brown/10 text-brand-brown'}`}>
                        {feature.category}
                      </span>
                    </div>
                    <p className="text-xs text-brand-brown/65 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Screenshots ── */}
      {product.screenshots.length > 0 && (
        <div>
          <p className="text-xs font-bold text-brand-brown/50 uppercase tracking-widest mb-4">
            Screenshots
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.screenshots.map((url, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-brand-brown/10 bg-brand-brown/5 aspect-video flex items-center justify-center">
                <img
                  src={url}
                  alt={`Screenshot ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom CTA ── */}
      <Card padding="lg" className="text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-brown/5 via-transparent to-brand-medium/5 pointer-events-none" aria-hidden="true" />
        <div className="relative z-10">
          <h3 className="text-2xl font-black text-brand-brown mb-3 font-display">
            Ready to network smarter?
          </h3>
          <p className="text-sm text-brand-brown/70 mb-6 max-w-md mx-auto">
            Join professionals on {product.name}. Get started free — no credit card required.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {product.demoLink ? (
              <Link href={product.demoLink} target="_blank">
                <Button variant="primary" size="lg">Get started free</Button>
              </Link>
            ) : (
              <Button variant="primary" size="lg">Get started free</Button>
            )}
            <Button variant="outline" size="lg">Book a demo</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}