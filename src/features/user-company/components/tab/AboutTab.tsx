'use client';
import type { ElementType } from 'react';
import { Target, Lightbulb, Shield, Globe } from 'lucide-react';
import { useAbout } from '../../hooks/useAbout';
import { Card, SectionHeading } from '../ui';

export function AboutTab() {
  const { meta, identity, loadingIdentity, timeline, loadingTimeline } = useAbout();

  const pillars = [
    {
      icon: Target,
      title: 'Our Mission',
      text: identity?.mission,
    },
    {
      icon: Lightbulb,
      title: 'Our Vision',
      text: identity?.vision,
    },
    {
      icon: Shield,
      title: 'Our Promise',
      content: identity?.promises,
      type: 'list' as const,
    },
    {
      icon: Globe,
      title: 'Our Impact',
      content: identity?.impacts,
      type: 'impacts' as const,
    },
  ];

  return (
    <div className="space-y-8 animate-slide-up">

      {/* ── Pillars ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {pillars.map(({ icon: Icon, title, text, content, type }) => (
          <Card key={title} hoverable padding="lg" className="group">
            <div className="w-10 h-10 bg-brand-brown rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-5 h-5 text-brand-cream" />
            </div>
            <h3 className="text-lg font-bold text-brand-brown mb-3 font-display">{title}</h3>

            {loadingIdentity ? (
              <div className="space-y-2">
                <div className="h-3 bg-brand-brown/10 rounded-full animate-pulse w-full" />
                <div className="h-3 bg-brand-brown/10 rounded-full animate-pulse w-4/5" />
              </div>
            ) : type === 'list' && Array.isArray(content) ? (
              // Promises — bullet list
              <ul className="space-y-2">
                {(content as string[]).map((promise, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-brand-brown/75">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-brown/40 flex-shrink-0" />
                    {promise}
                  </li>
                ))}
              </ul>
            ) : type === 'impacts' && Array.isArray(content) ? (
              // Impacts — metric + title + desc
              <div className="space-y-3">
                {(content as { metric: string; title: string; description: string }[]).map((impact, idx) => (
                  <div key={idx}>
                    <p className="text-xl font-black text-brand-brown font-display leading-none">
                      {impact.metric}
                    </p>
                    <p className="text-sm font-semibold text-brand-brown/80 mt-0.5">
                      {impact.title}
                    </p>
                    <p className="text-xs text-brand-brown/55 mt-0.5 leading-relaxed">
                      — {impact.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              // Mission / Vision — plain text
              <p className="text-sm text-brand-brown/75 leading-relaxed">{text}</p>
            )}
          </Card>
        ))}
      </div>

      {/* ── Story ── */}
      <Card padding="lg">
        <SectionHeading className="mb-4">Our Story</SectionHeading>
        {loadingIdentity ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-brand-brown/10 rounded-full animate-pulse" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        ) : identity?.story ? (
          <div className="space-y-3 text-sm text-brand-brown/80 leading-relaxed">
            {identity.story.split('. ').reduce<string[]>((acc, sentence, idx, arr) => {
              // ~2 sentences per paragraph
              if (idx % 2 === 0) {
                const next = arr[idx + 1];
                acc.push(sentence + (next ? '. ' + next + '.' : '.'));
              }
              return acc;
            }, []).map((para, idx) => (
              <p key={idx} className={idx === 0 ? 'text-base font-medium text-brand-brown' : ''}>
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-brown/60 italic">No story added yet.</p>
        )}
      </Card>

      {/* ── Timeline ── */}
      <Card padding="lg">
        <SectionHeading subtitle="Key moments in our journey" className="mb-8">
          Our Timeline
        </SectionHeading>

        {loadingTimeline ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 items-start animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-brand-brown/10 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-brand-brown/10 rounded-full w-1/3" />
                  <div className="h-3 bg-brand-brown/08 rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : timeline.length > 0 ? (
          <div className="relative">
            <div
              className="absolute left-6 top-2 bottom-2 w-px hidden md:block"
              aria-hidden="true"
              style={{ background: 'linear-gradient(to bottom, #4a3728, #8b6f47, #e0d8cf)' }}
            />
            <div className="space-y-6">
              {timeline.map((item, idx) => {
                const date = new Date(item.year, item.month - 1).toLocaleString('en-IN', {
                  month: 'short', year: 'numeric',
                });

                const TYPE_COLORS: Record<string, string> = {
                  Founding: 'bg-violet-100 text-violet-700',
                  Funding: 'bg-emerald-100 text-emerald-700',
                  'Product Launch': 'bg-blue-100 text-blue-700',
                  Milestone: 'bg-amber-100 text-amber-700',
                };

                return (
                  <div key={item._id} className="relative flex gap-4 items-start group">
                    {/* Icon bubble */}
                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl bg-brand-brown flex items-center justify-center shadow-md text-xl ring-4 ring-[#f7f3ef] group-hover:scale-105 transition-transform duration-200">
                      {item.icon}
                      {idx === timeline.length - 1 && (
                        <span className="absolute inset-0 rounded-2xl ring-2 ring-brand-brown/30 animate-ping opacity-50" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2 group-hover:-translate-y-0.5 transition-transform duration-200">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-brand-brown/60 bg-brand-beige px-2 py-0.5 rounded-full">
                          {date}
                        </span>
                        <h3 className="text-sm font-bold text-brand-brown">{item.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[item.type] ?? 'bg-brand-brown/10 text-brand-brown'}`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-brand-brown/65 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-brand-brown/60 italic">No timeline entries added yet.</p>
        )}
      </Card>

      {/* ── By the Numbers ── */}
      <Card padding="lg">
        <SectionHeading className="mb-6">By the Numbers</SectionHeading>

        {loadingIdentity ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 text-center">
                <div className="h-8 bg-brand-brown/10 rounded-full animate-pulse mx-auto w-20" />
                <div className="h-3 bg-brand-brown/10 rounded-full animate-pulse mx-auto w-24" />
                <div className="h-3 bg-brand-brown/10 rounded-full animate-pulse mx-auto w-32" />
              </div>
            ))}
          </div>
        ) : identity?.impacts?.length ? (
          <div className={`grid gap-6 ${identity.impacts.length <= 2 ? 'grid-cols-2' : identity.impacts.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {identity.impacts.map(({ metric, title, description }) => (
              <div key={title} className="text-center p-4 rounded-2xl bg-brand-brown/5 border border-brand-brown/10">
                <p className="text-3xl font-black text-brand-brown font-display leading-none mb-1">
                  {metric}
                </p>
                <p className="text-sm font-semibold text-brand-brown/80 mb-1">
                  {title}
                </p>
                <p className="text-xs text-brand-brown/50 leading-relaxed">
                  — {description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { n: '50K+', label: 'Active users', desc: 'Professionals on the platform' },
              { n: '28+', label: 'Countries', desc: 'Global reach' },
              { n: `${meta?.employeeCount || '—'}`, label: 'Team members', desc: 'And growing' },
              { n: '₹17.5Cr', label: 'Raised to date', desc: 'From top investors' },
            ].map(({ n, label, desc }) => (
              <div key={label} className="p-4 rounded-2xl bg-brand-brown/5 border border-brand-brown/10">
                <p className="text-3xl font-black text-brand-brown font-display leading-none mb-1">{n}</p>
                <p className="text-sm font-semibold text-brand-brown/80 mb-1">{label}</p>
                <p className="text-xs text-brand-brown/50 leading-relaxed">— {desc}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}