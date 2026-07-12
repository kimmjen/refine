import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Circle } from 'lucide-react';
import PlatformIcon from '../common/PlatformIcon';
import { formatDate, cn } from '@/lib/utils';
import { SharedLink } from '@/types/db';
import { MouseEvent } from 'react';
import { motion, Variants } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'next-i18next';

interface LinkCardProps {
  link: SharedLink;
  delay?: number;
  onToggleRead?: (id: number, currentStatus: boolean) => void;
  viewMode?: 'grid' | 'list';
}

const LinkCard = memo(({ link, delay = 0, onToggleRead, viewMode = 'grid' }: LinkCardProps) => {
  const { t } = useTranslation('common');
  const { id, title, url, created_at, platform, category, is_read, image_url } = link;
  const displayPlatform = platform || 'Website';
  const displayCategory = category || t('etc');

  const getSmartTitle = () => {
    if (title && !['Shared Link', 'Untitled Link', 'Untitled'].includes(title)) return title;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Untitled';
    }
  };

  const handleToggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleRead) onToggleRead(id, is_read);
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, delay: delay * 0.03 } },
  };

  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <Link href={`/link/${id}`} className="block group active:scale-[0.98] transition-transform duration-100">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-colors",
            is_read && "opacity-50"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggle}
                  className="h-7 w-7 -m-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  {is_read ? <CheckCircle2 size={16} className="text-primary" /> : <Circle size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{is_read ? t('mark_as_unread') : t('mark_as_read')}</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getSmartTitle()}</p>
              <p className="text-[10px] text-muted-foreground">{displayPlatform} · {formatDate(created_at)}</p>
            </div>
            <Badge variant="secondary" className="text-[9px] h-5 rounded px-1.5 font-medium hidden sm:inline-flex">{displayCategory}</Badge>
          </div>
        </Link>
      </motion.div>
    );
  }

  // GRID VIEW
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="h-full">
      <Link href={`/link/${id}`} className="block h-full group active:scale-[0.98] transition-transform duration-100">
        <Card className={cn(
          "h-full flex flex-col overflow-hidden border-border/50 hover:border-border transition-colors rounded-lg",
          is_read && "opacity-50"
        )}>
          <div className="relative aspect-[16/9] bg-muted">
            {image_url ? (
              <Image src={image_url} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PlatformIcon platform={displayPlatform} size={32} className="text-muted-foreground/30" />
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggle}
                  className="absolute top-2 right-2 h-8 w-8 rounded-md bg-background/80 backdrop-blur text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                >
                  {is_read ? <CheckCircle2 size={14} className="text-primary" /> : <Circle size={14} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{is_read ? t('mark_as_unread') : t('mark_as_read')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="p-3 flex flex-col gap-1.5 flex-grow">
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[9px] h-4 rounded px-1 font-medium">{displayCategory}</Badge>
              <span className="text-[10px] text-muted-foreground">{formatDate(created_at)}</span>
            </div>
            <h3 className="text-sm font-medium line-clamp-2 leading-snug">{getSmartTitle()}</h3>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.link.id === next.link.id &&
    prev.link.is_read === next.link.is_read &&
    prev.link.title === next.link.title &&
    prev.link.image_url === next.link.image_url &&
    prev.viewMode === next.viewMode
  );
});

LinkCard.displayName = 'LinkCard';

export default LinkCard;
