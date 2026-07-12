import { useState } from 'react';
import { SharedLink, LinkMetadata } from '@/types/db';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, Calendar, MoreVertical, PlayCircle, Share2, Tag, Trash2, Loader2, Edit3 } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import PlatformIcon from '@/components/common/PlatformIcon';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ensureProtocol } from '@/lib/url';
import { useTranslation } from 'next-i18next';

interface LinkDetailCardProps {
  link: SharedLink;
  metadata: LinkMetadata | null;
  images?: string[];
  onDelete?: () => void;
  onEnrich?: () => void;
  onEditCategory?: () => void;
  isDeleting?: boolean;
  isEnriching?: boolean;
}

export default function LinkDetailCard({
  link,
  metadata,
  images = [],
  onDelete,
  onEnrich,
  onEditCategory,
  isDeleting = false,
  isEnriching = false
}: LinkDetailCardProps) {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);

  const displayPlatform = link.platform || 'Website';
  const displayImage = images.length > 0 ? images[0] : link.image_url;
  const hasMultipleImages = images.length > 1;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title || 'Shared Link',
          url: window.location.href,
        });
      } catch (err) {
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-background min-h-screen md:min-h-0 md:pb-10">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <Badge
          variant="outline"
          className="text-[10px] h-5 px-2 rounded-full font-medium border-primary/20 text-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={onEditCategory}
        >
          {link.category || 'Uncategorized'}
        </Badge>
        <span className="text-[11px] font-medium flex items-center gap-1">
          <PlatformIcon platform={displayPlatform} size={12} />
          {displayPlatform}
        </span>
        <span className="text-[10px] opacity-50">•</span>
        <span className="text-[11px] flex items-center gap-1">
          <Calendar size={10} />
          {formatDate(link.created_at)}
        </span>
      </div>

      <h1 className="text-xl md:text-2xl font-bold leading-tight tracking-tight text-foreground mb-6 break-words">
        {link.title}
      </h1>

      {isEnriching ? (
        <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-950/20 p-5 mb-8 animate-pulse">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/30" />
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <div className="space-y-2 w-full">
                <div className="h-4 bg-indigo-200 dark:bg-indigo-900/50 rounded w-3/4"></div>
                <div className="h-4 bg-indigo-200 dark:bg-indigo-900/50 rounded w-1/2"></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-9">
              <div className="h-5 w-16 bg-indigo-200 dark:bg-indigo-900/50 rounded"></div>
              <div className="h-5 w-20 bg-indigo-200 dark:bg-indigo-900/50 rounded"></div>
              <div className="h-5 w-14 bg-indigo-200 dark:bg-indigo-900/50 rounded"></div>
            </div>
          </div>
        </div>
      ) : (metadata?.ai_summary || (metadata?.ai_tags && metadata.ai_tags.length > 0)) && (
        <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-950/20 p-5 mb-8">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/30" />

          <div className="flex flex-col gap-3">
            {metadata.ai_summary && (
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={14} />
                </div>
                <p className="text-sm font-medium leading-relaxed text-indigo-950 dark:text-indigo-100">
                  {metadata.ai_summary}
                </p>
              </div>
            )}

            {metadata.ai_tags && metadata.ai_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-9">
                {metadata.ai_tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-white/5 shadow-sm">
                    <Tag size={8} className="mr-1 opacity-50" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {hasMultipleImages ? (
        <div className="mb-8 rounded-xl overflow-hidden shadow-sm border border-border/50 bg-muted/20 relative group">
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((img, idx) => {
                const isVideoFile = /\.(mp4|mov|webm|gif)($|\?)/i.test(img);
                return (
                  <CarouselItem key={idx}>
                    <div className="aspect-video w-full flex items-center justify-center bg-black/5 dark:bg-white/5">
                      {isVideoFile ? (
                        <video
                          src={img}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={img}
                          alt={`${link.title} - ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Carousel>
        </div>
      ) : displayImage ? (
        <div className="mb-8 rounded-xl overflow-hidden shadow-sm border border-border/50 bg-muted/20 relative group">
          <div className="aspect-video w-full flex items-center justify-center bg-black/5 dark:bg-white/5">
            <img
              src={displayImage}
              alt={link.title || 'Cover'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {(link.platform === 'YouTube' || link.url?.includes('youtu')) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors cursor-pointer" onClick={() => link.url && window.open(link.url, '_blank')}>
                <div className="w-14 h-14 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-red-600 transition-transform duration-300 group-hover:scale-110">
                  <PlayCircle size={28} fill="currentColor" className="text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-8 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/10">
          <PlatformIcon platform={displayPlatform} size={48} className="opacity-20 grayscale" />
        </div>
      )}

      <div className="prose prose-gray dark:prose-invert max-w-none mb-12">
        <div className={cn("relative", !isExpanded && link.description && link.description.length > 300 && "max-h-[300px] overflow-hidden")}>
          <p className="text-base leading-7 text-muted-foreground whitespace-pre-wrap">
            {link.description || t('link_no_description')}
          </p>

          {!isExpanded && link.description && link.description.length > 300 && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-2">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)} className="bg-background/80 backdrop-blur-sm shadow-sm border">
                {t('link_read_more')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-full bg-background/80 backdrop-blur-md border shadow-lg z-50">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" title={t('link_share')} onClick={handleShare}>
          <Share2 size={18} />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="default" size="sm" className="rounded-full px-5 h-9 font-medium" onClick={() => link.url && window.open(ensureProtocol(link.url), '_blank')} disabled={!link.url}>
          {t('link_visit_site')} <ExternalLink size={14} className="ml-2" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" title={t('link_more_options')}>
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEditCategory} className="cursor-pointer">
              <Edit3 size={16} className="mr-2" /> {t('link_edit_category')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEnrich} disabled={isEnriching} className="cursor-pointer">
              {isEnriching ? <Loader2 size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2 text-violet-500" />}
              {t('link_ai_enrich')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} disabled={isDeleting} className="text-destructive focus:text-destructive cursor-pointer">
              {isDeleting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
