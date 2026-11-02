/**
 * Centralized Ultra-HD Pizza Photography Mapping System
 * Every pizza in the 16-item catalog + Hero banner is mapped to a unique,
 * verified high-resolution food photograph with Retina/4K parameters.
 */

export interface PizzaPhotoSpec {
  id: number;
  slug: string;
  name: string;
  primaryUrl: string;
  highResUrl: string;
  fallbackUrl: string;
  alt: string;
}

export const HERO_PIZZA_PHOTO = {
  primaryUrl:
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2400&q=90',
  fallbackUrl:
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=2000&q=85',
  alt: 'Artisanal wood-fired Neapolitan pizza pulled fresh from a stone brick oven with bubbling mozzarella and basil',
};

export const PIZZA_IMAGE_MAP: Record<string, PizzaPhotoSpec> = {
  'margherita-classica-dop': {
    id: 1,
    slug: 'margherita-classica-dop',
    name: 'Margherita Classica DOP',
    primaryUrl:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/margherita.svg',
    alt: 'Margherita Classica DOP — Traditional Neapolitan pizza with San Marzano tomato sauce, fresh mozzarella, basil leaves and olive oil',
  },
  'farmhouse-harvest-crunch': {
    id: 2,
    slug: 'farmhouse-harvest-crunch',
    name: 'Farmhouse Harvest Crunch',
    primaryUrl:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/farmhouse.svg',
    alt: 'Farmhouse Harvest Crunch — Vegetable-loaded pizza with bell peppers, sweet corn, red onions, mushrooms and tomatoes',
  },
  'quattro-formaggi-gold': {
    id: 3,
    slug: 'quattro-formaggi-gold',
    name: 'Quattro Formaggi Gold',
    primaryUrl:
      'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/quattro-formaggi.svg',
    alt: 'Quattro Formaggi Gold — Premium four-cheese pizza with mozzarella, Gorgonzola, Parmesan and Scamorza',
  },
  'mediterranean-kalamata': {
    id: 4,
    slug: 'mediterranean-kalamata',
    name: 'Mediterranean Kalamata',
    primaryUrl:
      'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/mediterranean.svg',
    alt: 'Mediterranean Kalamata — Mediterranean pizza with Kalamata olives, feta cheese, spinach and sun-dried tomatoes',
  },
  'black-truffle-wild-mushroom': {
    id: 5,
    slug: 'black-truffle-wild-mushroom',
    name: 'Black Truffle & Wild Mushroom',
    primaryUrl:
      'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/truffle-mushroom.svg',
    alt: 'Black Truffle & Wild Mushroom — Luxury gourmet pizza with black truffle, roasted shiitake and cremini mushrooms and melted fontina cheese',
  },
  'genovese-pesto-burrata': {
    id: 6,
    slug: 'genovese-pesto-burrata',
    name: 'Genovese Pesto & Burrata',
    primaryUrl:
      'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/pesto-burrata.svg',
    alt: 'Genovese Pesto & Burrata — Italian pesto pizza with fresh basil pesto, creamy burrata, cherry tomatoes and pine nuts',
  },
  'caramelized-fig-chicken': {
    id: 7,
    slug: 'caramelized-fig-chicken',
    name: 'Caramelized Fig & Prosciutto Chicken',
    primaryUrl:
      'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/fig-chicken.svg',
    alt: 'Caramelized Fig & Prosciutto Chicken — Gourmet chicken pizza with caramelized figs, balsamic onions, arugula and Parmesan',
  },
  'garlic-confit-rosemary-bianca': {
    id: 8,
    slug: 'garlic-confit-rosemary-bianca',
    name: 'Garlic Confit & Rosemary Bianca',
    primaryUrl:
      'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/garlic-bianca.svg',
    alt: 'Garlic Confit & Rosemary Bianca — White pizza with roasted garlic, rosemary, ricotta and aged pecorino',
  },
  'fiery-peri-peri-paneer': {
    id: 9,
    slug: 'fiery-peri-peri-paneer',
    name: 'Fiery Peri-Peri Paneer',
    primaryUrl:
      'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/peri-paneer.svg',
    alt: 'Fiery Peri-Peri Paneer — Indian spicy paneer pizza with grilled paneer cubes, red paprika, capsicum and peri-peri sauce',
  },
  'calabrian-diavola-hot-honey': {
    id: 10,
    slug: 'calabrian-diavola-hot-honey',
    name: 'Calabrian Diavola Hot Honey',
    primaryUrl:
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/diavola.svg',
    alt: 'Calabrian Diavola Hot Honey — Spicy pepperoni pizza with jalapenos, Calabrian chilies and hot honey glaze',
  },
  'mexican-jalapeno-fiesta': {
    id: 11,
    slug: 'mexican-jalapeno-fiesta',
    name: 'Mexican Jalapeno Fiesta',
    primaryUrl:
      'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/mexican-fiesta.svg',
    alt: 'Mexican Jalapeno Fiesta — Mexican vegetarian pizza with jalapenos, corn, beans, red onions and cheddar cheese',
  },
  'smoky-tandoori-chicken-tikka': {
    id: 12,
    slug: 'smoky-tandoori-chicken-tikka',
    name: 'Smoky Tandoori Chicken Tikka',
    primaryUrl:
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/tandoori-chicken.svg',
    alt: 'Smoky Tandoori Chicken Tikka — Indian tandoori chicken pizza with grilled chicken tikka, red onions, green chili and mint chutney',
  },
  'double-pepperoni-feast': {
    id: 13,
    slug: 'double-pepperoni-feast',
    name: 'Double Pepperoni Feast',
    primaryUrl:
      'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/pepperoni-feast.svg',
    alt: 'Double Pepperoni Feast — Premium double-pepperoni pizza with abundant crispy pepperoni slices and melted mozzarella',
  },
  'hickory-smoked-bbq-chicken': {
    id: 14,
    slug: 'hickory-smoked-bbq-chicken',
    name: 'Hickory Smoked BBQ Chicken',
    primaryUrl:
      'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1600628421055-4d30de868b8f?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/bbq-chicken.svg',
    alt: 'Hickory Smoked BBQ Chicken — BBQ chicken pizza with smoked chicken, caramelized onions, smoky BBQ sauce and Gouda',
  },
  'sicilian-meat-lovers-supreme': {
    id: 15,
    slug: 'sicilian-meat-lovers-supreme',
    name: 'Sicilian Meat Lovers Supreme',
    primaryUrl:
      'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/meat-lovers.svg',
    alt: 'Sicilian Meat Lovers Supreme — Loaded meat pizza with pepperoni, chicken sausage, grilled chicken and roasted bell peppers',
  },
  'roasted-garlic-herb-chicken': {
    id: 16,
    slug: 'roasted-garlic-herb-chicken',
    name: 'Roasted Garlic & Herb Chicken',
    primaryUrl:
      'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=85',
    highResUrl:
      'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=2200&q=90',
    fallbackUrl: '/images/pizzas/garlic-chicken.svg',
    alt: 'Roasted Garlic & Herb Chicken — Herb chicken pizza with grilled chicken, roasted garlic, spinach, sun-dried tomatoes and creamy sauce',
  },
};

export function resolvePizzaPhoto(
  pizzaOrSlug?: { id?: number; slug?: string; name?: string; image_url?: string } | string,
  highRes: boolean = false
): { src: string; fallback: string; alt: string } {
  if (!pizzaOrSlug) {
    return {
      src: HERO_PIZZA_PHOTO.primaryUrl,
      fallback: '/images/pizzas/margherita.svg',
      alt: HERO_PIZZA_PHOTO.alt,
    };
  }

  if (typeof pizzaOrSlug === 'string') {
    const bySlug = PIZZA_IMAGE_MAP[pizzaOrSlug];
    if (bySlug) {
      return {
        src: highRes ? bySlug.highResUrl : bySlug.primaryUrl,
        fallback: bySlug.fallbackUrl,
        alt: bySlug.alt,
      };
    }
    return {
      src: pizzaOrSlug,
      fallback: '/images/pizzas/margherita.svg',
      alt: 'Wood-fired artisanal pizza',
    };
  }

  const slugKey = pizzaOrSlug.slug || '';
  const bySlug = PIZZA_IMAGE_MAP[slugKey];
  if (bySlug) {
    return {
      src: highRes ? bySlug.highResUrl : bySlug.primaryUrl,
      fallback: bySlug.fallbackUrl,
      alt: bySlug.alt,
    };
  }

  const byId = Object.values(PIZZA_IMAGE_MAP).find((item) => item.id === pizzaOrSlug.id);
  if (byId) {
    return {
      src: highRes ? byId.highResUrl : byId.primaryUrl,
      fallback: byId.fallbackUrl,
      alt: byId.alt,
    };
  }

  return {
    src:
      pizzaOrSlug.image_url && pizzaOrSlug.image_url.startsWith('http')
        ? pizzaOrSlug.image_url
        : PIZZA_IMAGE_MAP['margherita-classica-dop'].primaryUrl,
    fallback: pizzaOrSlug.image_url || '/images/pizzas/margherita.svg',
    alt: pizzaOrSlug.name || 'Artisanal wood-fired pizza',
  };
}
