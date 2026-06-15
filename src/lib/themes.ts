/**
 * Design Themes - 5 estilos visuais estilo Google AI Studio
 * Cada tema define paleta de cores, tipografia, estilo de componentes
 */

export interface DesignTheme {
  id: string;
  name: string;
  description: string;
  emoji: string;
  prompt: string; // Injetado no LLM
  previewComponent: 'typography' | 'editorial' | 'glass' | 'gradient' | 'luxury';
  // Visual preview
  preview: {
    bg: string;
    text: string;
    accent: string;
    secondary: string;
  };
}

export const THEMES: DesignTheme[] = [
  {
    id: 'bold-typography',
    name: 'Bold Typography',
    description: 'Tipografia massiva e impactante',
    emoji: '🅱️',
    previewComponent: 'typography',
    prompt: `Use BOLD TYPOGRAPHY design system:
- Massive headlines (text-7xl to text-9xl), ultra-bold font-black
- Black/white/electric colors (yellow #FFD600, red #FF1744, electric blue)
- Generous whitespace, large margins
- Sans-serif heavy (Inter Black, Anton)
- Hero section dominates viewport, oversized CTA buttons
- Minimal sections, big statements, no clutter
- High contrast, dramatic feel
Use bg-[#FFD600] or bg-black with text-black for primary backgrounds.`,
    preview: {
      bg: '#FFD600',
      text: '#000000',
      accent: '#FF1744',
      secondary: '#FFFFFF',
    },
  },
  {
    id: 'editorial-aesthetic',
    name: 'Editorial',
    description: 'Estilo revista, elegante',
    emoji: '📰',
    previewComponent: 'editorial',
    prompt: `Use EDITORIAL AESTHETIC design system (magazine-style):
- Serif typography (Playfair Display, EB Garamond) for headlines
- Mix serif + sans-serif (Inter) for body
- Off-white background (#F8F5F0), deep black text (#0A0A0A)
- Subtle gold accent (#B8956A)
- Grid-based layouts, asymmetric compositions
- Pull quotes, large drop caps, refined spacing
- Vintage elegance meets modern editorial
- Image-forward with overlays, captions
- Uppercase tracking-wide for labels
Use bg-[#F8F5F0] and font-serif for headlines.`,
    preview: {
      bg: '#F8F5F0',
      text: '#0A0A0A',
      accent: '#B8956A',
      secondary: '#2C2C2C',
    },
  },
  {
    id: 'sophisticated-dark',
    name: 'Dark Glass',
    description: 'Dark premium com glassmorphism',
    emoji: '🌑',
    previewComponent: 'glass',
    prompt: `Use SOPHISTICATED DARK design system (premium dark mode):
- Deep black/navy background (#0A0A0F, #0F0F17)
- Subtle gradients: from-[#1A1A2E] via-[#16213E] to-[#0F3460]
- Glass morphism: backdrop-blur-md, bg-white/5 borders
- Subtle violet/fuchsia accents (#8B5CF6, #EC4899)
- Text white/60 to white/100 (layered contrast)
- Smooth transitions, hover states with opacity changes
- Premium SaaS feel (Linear, Vercel, Stripe)
- Tight typography, refined spacing
Use bg-[#0A0A0F] with bg-white/5 cards.`,
    preview: {
      bg: '#0A0A0F',
      text: '#FFFFFF',
      accent: '#8B5CF6',
      secondary: '#EC4899',
    },
  },
  {
    id: 'immersive-ui',
    name: 'Immersive',
    description: 'Visual impactante e vibrante',
    emoji: '🎨',
    previewComponent: 'gradient',
    prompt: `Use IMMERSIVE UI design system (vibrant, full-bleed):
- Full-viewport sections, parallax effects
- Vibrant gradients: from-purple-600 via-pink-500 to-orange-400
- Mesh gradients and noise textures
- 3D effects, floating elements, blur orbs
- Smooth scroll animations, reveal on scroll
- Bento grid layouts (asymmetric cards)
- Bright accents: #A855F7, #EC4899, #F59E0B
- Mix of glassmorphism + neumorphism
- Cinematic feel with dramatic contrasts
Use bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 for hero.`,
    preview: {
      bg: 'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F59E0B 100%)',
      text: '#FFFFFF',
      accent: '#F59E0B',
      secondary: '#A855F7',
    },
  },
  {
    id: 'elegant-dark',
    name: 'Luxury',
    description: 'Dark refinado com dourado',
    emoji: '✨',
    previewComponent: 'luxury',
    prompt: `Use ELEGANT DARK design system (luxury dark):
- Pure black background (#000000) with subtle warm tones
- Gold/champagne accents (#D4AF37, #F4E4BC)
- White text with reduced opacity layers (white/90, white/60)
- Serif headlines (Cormorant Garamond) + clean sans-serif body
- Thin gold borders (border-[#D4AF37]/20)
- Subtle radial gradients for depth
- Premium luxury feel (Apple, Rolex, high-end fashion)
- Generous spacing, refined animations
- Subtle hover effects with gold glow
Use bg-black with border-[#D4AF37]/30 and font-serif for headlines.`,
    preview: {
      bg: '#000000',
      text: '#F4E4BC',
      accent: '#D4AF37',
      secondary: '#FFFFFF',
    },
  },
];

export const DEFAULT_THEME = THEMES[0]; // Bold Typography
