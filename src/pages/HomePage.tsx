import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Flame,
  Clock,
  Copy,
  Check,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Pizza, Category, Topping } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { PizzaImage } from '../components/PizzaImage.tsx';
import { PizzaCustomizeModal } from '../components/PizzaCustomizeModal.tsx';
import { HERO_PIZZA_PHOTO } from '../config/pizzaImages.ts';
import { useToast } from '../hooks/useToast.tsx';

interface PizzaProductCardProps {
  pizza: Pizza;
  onSelectPizza: (pizza: Pizza) => void;
  highRes?: boolean;
  lazy?: boolean;
}

function PizzaProductCard({
  pizza,
  onSelectPizza,
  highRes = false,
  lazy = true,
}: PizzaProductCardProps) {
  return (
    <div className="group bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 shadow-2xs">
      <div>
        {/* Large 4:3 High-Resolution Pizza Image with Subtle Hover Zoom */}
        <div
          onClick={() => onSelectPizza(pizza)}
          className="relative aspect-[4/3] w-full overflow-hidden cursor-pointer bg-stone-900"
        >
          <PizzaImage
            src={pizza.image_url}
            alt={pizza.name}
            pizzaId={pizza.id}
            pizzaSlug={pizza.slug}
            pizzaName={pizza.name}
            highRes={highRes}
            lazy={lazy}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-mono pointer-events-none">
            <span className="bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-md">
              {pizza.prep_time_mins} mins · {pizza.calories} kcal
            </span>
            <span className="bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-md">
              8" / 10" / 12"
            </span>
          </div>
        </div>

        <div className="p-5">
          {/* Veg / Non-Veg Indicator & Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span
              className={`inline-flex items-center gap-1.5 font-semibold ${
                pizza.is_veg ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  pizza.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              />
              {pizza.is_veg ? 'Pure Veg' : 'Non-Veg'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{pizza.category_name}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                pizza.spice_level === 'Hot'
                  ? 'text-orange-600 font-medium'
                  : 'text-stone-500'
              }
            >
              {pizza.spice_level} Spice
            </span>
          </div>

          <h3
            onClick={() => onSelectPizza(pizza)}
            className="text-lg font-bold text-stone-900 mt-1.5 cursor-pointer hover:text-orange-600 transition-colors"
          >
            {pizza.name}
          </h3>

          <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
            {pizza.description}
          </p>
        </div>
      </div>

      {/* Card Footer with Starting Price, Select Size button & Customize & Add button */}
      <div className="px-5 pb-5 pt-3.5 border-t border-stone-100 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-stone-400 block">Starting Price (Regular 8")</span>
            <div className="text-lg font-bold font-mono text-stone-900 tabular-nums">
              ₹{pizza.base_price.toFixed(0)}
              <span className="text-xs font-normal text-stone-500"> onwards</span>
            </div>
          </div>
          <div className="text-right font-mono text-[11px] text-stone-500">
            Med ₹{pizza.sizes.find((s) => s.size_name === 'Medium')?.price || pizza.base_price + 150}{' '}
            · Lrg ₹{pizza.sizes.find((s) => s.size_name === 'Large')?.price || pizza.base_price + 300}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onSelectPizza(pizza)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-300 hover:border-orange-500 hover:text-orange-600 text-stone-800 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Select Size</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPizza(pizza)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customize & Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      apiRequest<{ pizzas: Pizza[]; toppings: Topping[] }>('/api/pizzas'),
      apiRequest<{ categories: Category[] }>('/api/categories'),
    ])
      .then(([pizzaRes, catRes]) => {
        setPizzas(pizzaRes.pizzas || []);
        setToppings(pizzaRes.toppings || []);
        setCategories(catRes.categories || []);
      })
      .catch((err) => {
        showToast('Error loading menu catalog', 'error', err?.message);
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  // Featured Section Filters
  const signaturePizza =
    pizzas.find((p) => p.slug === 'black-truffle-wild-mushroom') || pizzas[4] || pizzas[0];
  const secondSignaturePizza =
    pizzas.find((p) => p.slug === 'genovese-pesto-burrata') || pizzas[5] || pizzas[1];

  const popularPizzas = pizzas.filter((p) => p.is_popular === 1).slice(0, 6);
  const gourmetArtisanPizzas = pizzas.filter(
    (p) => p.category_slug === 'gourmet-artisan' || p.category_id === 2
  );
  const spicyBoldPizzas = pizzas.filter(
    (p) => p.category_slug === 'spicy-and-bold' || p.category_id === 3
  );
  const customerFavorites = pizzas.filter((p) => p.is_best_seller === 1).slice(0, 6);

  const copyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    showToast(`Coupon ${code} copied`, 'success', 'Apply at cart or checkout.');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div>
      {/* 1. Full-Width Gourmet Pizza Hero Banner with Dark Gradient Overlay */}
      <section className="relative bg-stone-950 text-white border-b border-stone-800 overflow-hidden">
        {/* Background Ultra-HD Wood-Fired Hero Photograph */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_PIZZA_PHOTO.primaryUrl}
            alt={HERO_PIZZA_PHOTO.alt}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/85 to-stone-950/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-400 tracking-wider uppercase">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Stone-Baked at 450°C · Fresh Pizza. Happy Moments.</span>
              </div>

              <h1
                className="mt-3 font-bold text-white tracking-tight leading-[1.06] font-display"
                style={{ fontSize: 'clamp(2.4rem, 4.3vw, 4rem)' }}
              >
                Artisanal Wood-Fired Neapolitan Pizzas Delivered Hot.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-stone-200 max-w-2xl leading-relaxed">
                Hand-stretched 48-hour fermented dough with Caputo Tipo 00 flour, crushed San
                Marzano DOP tomatoes, and creamy fior di latte mozzarella. Select your crust size
                and gourmet toppings in seconds.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-orange-500/25 whitespace-nowrap"
                >
                  <span>Order from Full Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {signaturePizza && (
                  <button
                    type="button"
                    onClick={() => setSelectedPizza(signaturePizza)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-400/40 text-orange-200 text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span>Try Chef’s Truffle Signature</span>
                  </button>
                )}
                <Link
                  to="/admin/sql-lab"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-stone-700 bg-stone-900/70 hover:border-stone-500 text-stone-200 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <span>Explore DBMS SQL Lab</span>
                </Link>
              </div>

              <div className="mt-10 pt-8 border-t border-white/15 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="text-2xl font-bold font-mono text-white">16</div>
                  <div className="text-xs text-stone-300 mt-0.5">Chef-Crafted Pizzas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-orange-400">18 min</div>
                  <div className="text-xs text-stone-300 mt-0.5">Avg. Oven Bake Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-white">₹500+</div>
                  <div className="text-xs text-stone-300 mt-0.5">Free Express Delivery</div>
                </div>
              </div>
            </div>

            {/* Featured Hero Spotlight Card */}
            <div className="lg:col-span-5">
              {signaturePizza && (
                <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-stone-900/90 shadow-2xl">
                  <div className="aspect-[4/3] w-full overflow-hidden relative">
                    <PizzaImage
                      src={signaturePizza.image_url}
                      alt={signaturePizza.name}
                      pizzaId={signaturePizza.id}
                      pizzaSlug={signaturePizza.slug}
                      pizzaName={signaturePizza.name}
                      highRes={true}
                      lazy={false}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />
                    <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-md shadow-md">
                      CHEF’S SIGNATURE SELECTION
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-xs text-orange-400 font-mono">
                      Gourmet Artisan · 100% Vegetarian · {signaturePizza.calories} kcal
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-1">{signaturePizza.name}</h2>
                    <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                      {signaturePizza.description}
                    </p>
                    <div className="mt-5 pt-4 border-t border-stone-800 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] text-stone-400 block">
                          Regular 8" / Medium 10" / Large 12"
                        </span>
                        <span className="text-lg font-bold font-mono text-white">
                          ₹{signaturePizza.base_price}
                          <span className="text-xs font-normal text-stone-400"> onwards</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPizza(signaturePizza)}
                        className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors inline-flex items-center gap-2"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Customize & Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pizza Categories Strip & Promotional Coupons */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
              Curated Collections
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Explore by Pizza Category
            </h2>
          </div>
          <Link
            to="/menu"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
          >
            <span>View All {pizzas.length || 16} Pizzas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/menu?category=${cat.slug}`)}
              className="group text-left p-6 rounded-2xl bg-white border border-stone-200 hover:border-orange-500 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                <span>0{cat.display_order}</span>
                <span>{cat.pizza_count || 4} Pizzas</span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 mt-2 group-hover:text-orange-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </button>
          ))}
        </div>

        {/* Special Promotional Offers */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              code: 'WELCOME100',
              title: 'Flat ₹100 Off First Order',
              terms: 'Valid on orders above ₹400 · All categories',
            },
            {
              code: 'FEAST150',
              title: '₹150 Off Family Pizza Feast',
              terms: 'Valid on orders above ₹900 · Medium & Large pizzas',
            },
            {
              code: 'PIZZA20',
              title: '20% Instant Savings (Up to ₹250)',
              terms: 'Valid on orders above ₹600 · Online & COD',
            },
          ].map((offer) => (
            <div
              key={offer.code}
              className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-800 flex items-center justify-between gap-4"
            >
              <div>
                <div className="text-xs text-orange-400 font-mono">{offer.code}</div>
                <div className="text-sm font-bold text-white mt-1">{offer.title}</div>
                <div className="text-xs text-stone-400 mt-1">{offer.terms}</div>
              </div>
              <button
                type="button"
                onClick={() => copyCoupon(offer.code)}
                className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-orange-500 text-xs font-mono font-semibold text-white transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Section 1: Chef's Signature Selection */}
      {(signaturePizza || secondSignaturePizza) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-stone-950 text-white rounded-3xl p-6 sm:p-10 border border-stone-800">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  Featured Section 01 · Artisanal Masterpieces
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  Chef’s Signature Selection
                </h2>
                <p className="text-xs sm:text-sm text-stone-400 mt-1">
                  Handcrafted with Umbrian black truffle paste, Genovese basil pesto, and fresh
                  burrata crown.
                </p>
              </div>
              <Link
                to="/menu?category=gourmet-artisan"
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 inline-flex items-center gap-1.5"
              >
                <span>View Gourmet Artisan Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[signaturePizza, secondSignaturePizza].filter(Boolean).map((pizza) => (
                <div
                  key={pizza.id}
                  className="group bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12"
                >
                  <div
                    onClick={() => setSelectedPizza(pizza)}
                    className="sm:col-span-5 relative aspect-[4/3] sm:aspect-auto overflow-hidden cursor-pointer bg-stone-950"
                  >
                    <PizzaImage
                      src={pizza.image_url}
                      alt={pizza.name}
                      pizzaId={pizza.id}
                      pizzaSlug={pizza.slug}
                      pizzaName={pizza.name}
                      highRes={true}
                      lazy={false}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="sm:col-span-7 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-orange-400 font-mono">
                        <span>{pizza.is_veg ? 'Pure Veg' : 'Non-Veg'}</span>
                        <span>·</span>
                        <span>{pizza.prep_time_mins} mins</span>
                        <span>·</span>
                        <span>{pizza.calories} kcal</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-1.5">{pizza.name}</h3>
                      <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                        {pizza.description}
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-stone-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-stone-400 block">Starts at</span>
                        <span className="text-lg font-bold font-mono text-white">
                          ₹{pizza.base_price}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPizza(pizza)}
                          className="px-3 py-2 rounded-xl border border-stone-700 hover:border-orange-500 text-stone-200 text-xs font-semibold transition-colors"
                        >
                          Select Size
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPizza(pizza)}
                          className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
                        >
                          Customize & Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Featured Section 2: Popular Pizzas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
              Featured Section 02 · Trending Now
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">Popular Pizzas</h2>
          </div>
          <Link
            to="/menu"
            className="text-sm font-semibold text-stone-700 hover:text-orange-600 inline-flex items-center gap-1.5"
          >
            <span>Browse Full Menu Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-96 rounded-2xl bg-white border border-stone-200 animate-pulse p-4"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularPizzas.map((pizza) => (
              <PizzaProductCard
                key={pizza.id}
                pizza={pizza}
                onSelectPizza={setSelectedPizza}
                lazy={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Featured Section 3: Gourmet Artisan Collection */}
      {gourmetArtisanPizzas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-stone-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                Featured Section 03 · Wood-Fired Specialty
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                Gourmet Artisan Collection
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Black truffle, fresh burrata, caramelized fig prosciutto chicken, and garlic confit
                rosemary bianca.
              </p>
            </div>
            <Link
              to="/menu?category=gourmet-artisan"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
            >
              <span>Filter Gourmet Artisan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gourmetArtisanPizzas.map((pizza) => (
              <PizzaProductCard
                key={pizza.id}
                pizza={pizza}
                onSelectPizza={setSelectedPizza}
                lazy={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. Featured Section 4: Spicy & Bold Collection */}
      {spicyBoldPizzas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-stone-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                Featured Section 04 · High-Heat Creations
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                Spicy & Bold Collection
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Infused with African bird-eye peri-peri paneer, Calabrian chili hot honey, jalapenos,
                and smoky tandoori tikka.
              </p>
            </div>
            <Link
              to="/menu?category=spicy-and-bold"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
            >
              <span>Filter Spicy & Bold</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {spicyBoldPizzas.map((pizza) => (
              <PizzaProductCard
                key={pizza.id}
                pizza={pizza}
                onSelectPizza={setSelectedPizza}
                lazy={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. Featured Section 5: Customer Favorites */}
      {customerFavorites.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-stone-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                Featured Section 05 · All-Time Best Sellers
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                Customer Favorites
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Our highest-rated best sellers ranked by order volume in <code>pizzahub_db</code>.
              </p>
            </div>
            <Link
              to="/menu"
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
            >
              <span>Explore All 16 Pizzas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customerFavorites.map((pizza) => (
              <PizzaProductCard
                key={pizza.id}
                pizza={pizza}
                onSelectPizza={setSelectedPizza}
                lazy={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Interactive Size & Topping Customization Modal */}
      <PizzaCustomizeModal
        pizza={selectedPizza}
        allToppings={toppings}
        onClose={() => setSelectedPizza(null)}
      />
    </div>
  );
}
