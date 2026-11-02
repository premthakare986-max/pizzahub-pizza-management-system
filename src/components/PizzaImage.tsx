import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { resolvePizzaPhoto } from '../config/pizzaImages.ts';

interface PizzaImageProps {
  src?: string;
  alt: string;
  pizzaId?: number;
  pizzaSlug?: string;
  pizzaName?: string;
  highRes?: boolean;
  lazy?: boolean;
  className?: string;
}

export function PizzaImage({
  src,
  alt,
  pizzaId,
  pizzaSlug,
  pizzaName,
  highRes = false,
  lazy = true,
  className = '',
}: PizzaImageProps) {
  const resolved = resolvePizzaPhoto(
    {
      id: pizzaId,
      slug: pizzaSlug,
      name: pizzaName || alt,
      image_url: src,
    },
    highRes
  );

  const [currentSrc, setCurrentSrc] = useState<string>(resolved.src);
  const [stage, setStage] = useState<'primary' | 'fallback_svg' | 'custom_card'>('primary');

  useEffect(() => {
    setCurrentSrc(resolved.src);
    setStage('primary');
  }, [resolved.src]);

  const handleImageError = () => {
    if (stage === 'primary' && resolved.fallback && currentSrc !== resolved.fallback) {
      setCurrentSrc(resolved.fallback);
      setStage('fallback_svg');
    } else {
      setStage('custom_card');
    }
  };

  if (stage === 'custom_card' || !currentSrc) {
    return (
      <div
        className={`bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
      >
        <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-400/40 flex items-center justify-center mb-2">
          <Flame className="w-8 h-8 text-orange-400" />
        </div>
        <span className="text-xs font-semibold text-stone-200 line-clamp-1">
          {pizzaName || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={resolved.alt || alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleImageError}
      className={`object-cover ${className}`}
    />
  );
}
