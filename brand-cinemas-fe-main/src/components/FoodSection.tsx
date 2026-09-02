import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, UtensilsCrossed, ArrowRight, Flame } from 'lucide-react';
import type { ConcessionItem } from '@/types/concession';
import { concessionService } from '@/services/concessionService';
import {
  getConcessionImageUrl,
  CATEGORY_FALLBACK_IMAGES,
  DEFAULT_CONCESSION_IMAGE,
} from '@/utils/concession';
import { useLanguage } from '@/contexts/LanguageContext';

function formatIdr(amount: number): string {
  return `IDR ${amount.toLocaleString('id-ID')}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  combo: 'bg-amber-500/20 text-amber-300',
  popcorn: 'bg-yellow-500/20 text-yellow-300',
  drinks: 'bg-cyan-500/20 text-cyan-300',
  snacks: 'bg-orange-500/20 text-orange-300',
};

export default function FoodSection(): ReactElement | null {
  const { t } = useLanguage();
  const [items, setItems] = useState<ConcessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    concessionService
      .getConcessions({ limit: 6 })
      .then((data) => {
        if (mounted) {
          setItems(data.filter((item) => item.isActive));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch food items:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  const highlightItem = items.find((i) => i.category === 'combo') || items[0];
  const recommendedItems = items.filter((i) => i.id !== highlightItem?.id).slice(0, 3);
  const displayRecommendations = recommendedItems.length > 0 ? recommendedItems : items.slice(0, 3);

  const bannerImage =
    highlightItem?.imageUrl ||
    CATEGORY_FALLBACK_IMAGES[highlightItem?.category || 'combo'] ||
    DEFAULT_CONCESSION_IMAGE;

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center sm:mb-10">
          <p className="section-eyebrow flex items-center gap-1.5">
            <UtensilsCrossed className="h-4 w-4 text-[#D5A527]" />
            {t('fnbEyebrow')}
          </p>
          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl md:text-4xl">
            {t('fnbTitle')}
          </h2>
          <p className="max-w-2xl px-2 text-sm text-gray-500 dark:text-slate-400 sm:px-0 sm:text-base">
            {t('fnbSubtitle')}
          </p>
        </div>

        {/* Split Banner Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Column: Big Promo / Highlight Banner */}
          <div className="relative overflow-hidden rounded-3xl border-0 bg-dark-900 p-6 shadow-2xl sm:p-8 lg:col-span-5 flex flex-col justify-between min-h-[360px] sm:min-h-[420px]">
            {/* Background image with blur/gradient overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-700 hover:scale-105"
              style={{
                backgroundImage: `url(${bannerImage})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-transparent" />

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D5A527]/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D5A527]">
                <Sparkles className="h-3.5 w-3.5" />
                {highlightItem?.badge || t('fnbSpecialPromo')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/25 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold text-red-300">
                <Flame className="h-3.5 w-3.5" />
                Favorite
              </span>
            </div>

            {/* Content info */}
            <div className="relative z-10 mt-auto pt-8">
              <h3 className="font-display text-2xl font-black text-white sm:text-3xl">
                {highlightItem?.name || t('fnbBannerTitle')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base line-clamp-3">
                {highlightItem?.description || t('fnbBannerDesc')}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                <div>
                  <span className="block text-xs uppercase tracking-wider text-slate-400">
                    {t('fnbStartingFrom')}
                  </span>
                  <span className="text-xl font-black text-[#D5A527] sm:text-2xl">
                    {formatIdr(highlightItem?.price || 55000)}
                  </span>
                </div>

                <Link
                  to="/movies"
                  className="btn btn-primary border-0 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-[#D5A527]/25"
                >
                  {t('fnbExploreMenu')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Recommendation Cards */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-7">
            {displayRecommendations.map((item) => {
              const categoryBadgeClass =
                CATEGORY_COLORS[item.category] || 'bg-gray-500/20 text-gray-300';
              const fallbackImg =
                CATEGORY_FALLBACK_IMAGES[item.category] || DEFAULT_CONCESSION_IMAGE;

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-1 items-center gap-4 overflow-hidden rounded-2xl border-0 bg-[var(--surface-card)] p-4 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl dark:bg-dark-900/90 sm:p-5"
                >
                  {/* Thumbnail Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-dark-800 sm:h-24 sm:w-24 shadow-md">
                    <img
                      src={item.imageUrl || fallbackImg}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = fallbackImg;
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    {item.badge && (
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-[#D5A527] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-dark-950 shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Text Information */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryBadgeClass}`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <h4 className="truncate text-base font-bold text-gray-900 transition-colors group-hover:text-[#D5A527] dark:text-white sm:text-lg">
                        {item.name}
                      </h4>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-slate-400 sm:text-sm">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#D5A527] sm:text-base">
                        {formatIdr(item.price)}
                      </span>
                      <Link
                        to="/movies"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 transition-colors group-hover:text-[#D5A527] dark:text-slate-400"
                      >
                        Order with tickets
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
