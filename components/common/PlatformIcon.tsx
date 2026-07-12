import { 
  Youtube, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Github, 
  Globe, 
  PenTool, 
  MessageCircle,
  AtSign
} from 'lucide-react';

interface PlatformIconProps {
  platform: string | null | undefined;
  size?: number;
  className?: string;
}

export default function PlatformIcon({ platform, size = 16, className }: PlatformIconProps) {
  // DB에 저장된 플랫폼 이름(Text)을 소문자로 변환하여 매칭
  const p = platform?.toLowerCase() || '';

  if (p.includes('youtube')) return <Youtube size={size} className={className} />;
  if (p.includes('instagram')) return <Instagram size={size} className={className} />;
  if (p.includes('facebook')) return <Facebook size={size} className={className} />;
  if (p.includes('linkedin')) return <Linkedin size={size} className={className} />;
  if (p.includes('twitter') || p.includes('x (twitter)')) return <Twitter size={size} className={className} />;
  if (p.includes('github')) return <Github size={size} className={className} />;
  if (p.includes('velog') || p.includes('medium')) return <PenTool size={size} className={className} />;
  if (p.includes('kakao')) return <MessageCircle size={size} className={className} />;
  if (p.includes('threads')) return <AtSign size={size} className={className} />; // Threads 추가

  // 기본값: 지구본 아이콘
  return <Globe size={size} className={className} />;
}
