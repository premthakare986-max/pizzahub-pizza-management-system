import { Request, Response } from 'express';
import { dbState, getEnrichedPizza, executeOnMySQLIfConnected } from '../services/relationalStore.ts';

export async function getAllPizzas(req: Request, res: Response) {
  const { search, category, isVeg, sortBy, popular, bestSeller, includeUnavailable } = req.query;

  let list = dbState.pizzas.filter((p) => (includeUnavailable === 'true' ? true : p.is_available === 1));

  if (search && String(search).trim() !== '') {
    const q = String(search).trim().toLowerCase();
    list = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    const catId = Number(category);
    if (!Number.isNaN(catId) && catId > 0) {
      list = list.filter((p) => p.category_id === catId);
    } else {
      const catObj = dbState.categories.find((c) => c.slug === String(category));
      if (catObj) list = list.filter((p) => p.category_id === catObj.id);
    }
  }

  if (isVeg === '1' || isVeg === 'true' || isVeg === 'veg') {
    list = list.filter((p) => p.is_veg === 1);
  } else if (isVeg === '0' || isVeg === 'false' || isVeg === 'non-veg') {
    list = list.filter((p) => p.is_veg === 0);
  }

  if (popular === 'true') {
    list = list.filter((p) => p.is_popular === 1);
  }

  if (bestSeller === 'true') {
    list = list.filter((p) => p.is_best_seller === 1);
  }

  const enriched = list.map(getEnrichedPizza);

  if (sortBy === 'price_asc') {
    enriched.sort((a, b) => a.base_price - b.base_price);
  } else if (sortBy === 'price_desc') {
    enriched.sort((a, b) => b.base_price - a.base_price);
  } else if (sortBy === 'name_asc') {
    enriched.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'calories_asc') {
    enriched.sort((a, b) => a.calories - b.calories);
  }

  return res.json({
    success: true,
    count: enriched.length,
    pizzas: enriched,
    toppings: dbState.toppings.filter((t) => t.is_available === 1),
  });
}

export async function getPizzaById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const pizza = dbState.pizzas.find((p) => p.id === id || p.slug === req.params.id);
  if (!pizza) {
    return res.status(404).json({ success: false, message: 'Pizza not found.' });
  }
  return res.json({
    success: true,
    pizza: getEnrichedPizza(pizza),
    available_toppings: dbState.toppings.filter((t) => t.is_available === 1),
  });
}

export async function createPizza(req: Request, res: Response) {
  try {
    const {
      category_id,
      name,
      description,
      image_url,
      is_veg,
      spice_level,
      is_popular,
      is_best_seller,
      is_available,
      prep_time_mins,
      calories,
      regular_price,
      medium_price,
      large_price,
    } = req.body;

    const trimmedName = String(name).trim();
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (dbState.pizzas.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'A pizza with this name already exists.',
      });
    }

    const catExists = dbState.categories.find((c) => c.id === Number(category_id));
    if (!catExists) {
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint failed: Invalid category_id.',
      });
    }

    const regPrice = Number(regular_price || req.body.base_price || 299);
    const medPrice = Number(medium_price || Math.round(regPrice * 1.45));
    const lrgPrice = Number(large_price || Math.round(regPrice * 1.85));

    const nextPizzaId = dbState.pizzas.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const now = new Date().toISOString();

    const newPizza = {
      id: nextPizzaId,
      category_id: Number(category_id),
      name: trimmedName,
      slug,
      description: String(description).trim(),
      image_url: String(image_url || '/images/pizzas/margherita.svg').trim(),
      base_price: regPrice,
      is_veg: is_veg === undefined ? 1 : Number(Boolean(is_veg)),
      spice_level: (['Mild', 'Medium', 'Hot'].includes(spice_level) ? spice_level : 'Mild') as 'Mild' | 'Medium' | 'Hot',
      is_popular: Number(Boolean(is_popular)),
      is_best_seller: Number(Boolean(is_best_seller)),
      is_available: is_available === undefined ? 1 : Number(Boolean(is_available)),
      prep_time_mins: Number(prep_time_mins || 18),
      calories: Number(calories || 760),
      created_at: now,
      updated_at: now,
    };

    dbState.pizzas.push(newPizza);

    let nextSizeId = dbState.pizza_sizes.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    dbState.pizza_sizes.push(
      { id: nextSizeId++, pizza_id: nextPizzaId, size_name: 'Regular', size_code: 'REG', diameter_inches: 8, price: regPrice, is_available: 1 },
      { id: nextSizeId++, pizza_id: nextPizzaId, size_name: 'Medium', size_code: 'MED', diameter_inches: 10, price: medPrice, is_available: 1 },
      { id: nextSizeId++, pizza_id: nextPizzaId, size_name: 'Large', size_code: 'LRG', diameter_inches: 12, price: lrgPrice, is_available: 1 }
    );

    // Add standard base recipe ingredients (flour + tomato + mozzarella)
    let nextPiId = dbState.pizza_ingredients.reduce((max, pi) => Math.max(max, pi.id), 0) + 1;
    dbState.pizza_ingredients.push(
      { id: nextPiId++, pizza_id: nextPizzaId, ingredient_id: 1, quantity_required: 0.25 },
      { id: nextPiId++, pizza_id: nextPizzaId, ingredient_id: 2, quantity_required: 0.12 },
      { id: nextPiId++, pizza_id: nextPizzaId, ingredient_id: 3, quantity_required: 0.15 }
    );

    await executeOnMySQLIfConnected(
      'CALL AddNewPizza(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @new_id)',
      [
        newPizza.category_id,
        newPizza.name,
        newPizza.slug,
        newPizza.description,
        newPizza.image_url,
        newPizza.is_veg,
        newPizza.spice_level,
        regPrice,
        medPrice,
        lrgPrice,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Pizza created via AddNewPizza procedure with Regular, Medium, and Large sizes.',
      pizza: getEnrichedPizza(newPizza),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to create pizza.' });
  }
}

export async function updatePizza(req: Request, res: Response) {
  const id = Number(req.params.id);
  const pizza = dbState.pizzas.find((p) => p.id === id);
  if (!pizza) {
    return res.status(404).json({ success: false, message: 'Pizza not found.' });
  }

  const {
    category_id,
    name,
    description,
    image_url,
    is_veg,
    spice_level,
    is_popular,
    is_best_seller,
    is_available,
    prep_time_mins,
    calories,
    regular_price,
    medium_price,
    large_price,
  } = req.body;

  if (category_id !== undefined) pizza.category_id = Number(category_id);
  if (name !== undefined) {
    pizza.name = String(name).trim();
    pizza.slug = pizza.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (description !== undefined) pizza.description = String(description).trim();
  if (image_url !== undefined) pizza.image_url = String(image_url).trim();
  if (is_veg !== undefined) pizza.is_veg = Number(Boolean(is_veg));
  if (spice_level !== undefined && ['Mild', 'Medium', 'Hot'].includes(spice_level)) {
    pizza.spice_level = spice_level;
  }
  if (is_popular !== undefined) pizza.is_popular = Number(Boolean(is_popular));
  if (is_best_seller !== undefined) pizza.is_best_seller = Number(Boolean(is_best_seller));
  if (is_available !== undefined) pizza.is_available = Number(Boolean(is_available));
  if (prep_time_mins !== undefined) pizza.prep_time_mins = Number(prep_time_mins);
  if (calories !== undefined) pizza.calories = Number(calories);

  if (regular_price !== undefined) {
    pizza.base_price = Number(regular_price);
    const regRow = dbState.pizza_sizes.find((s) => s.pizza_id === id && s.size_name === 'Regular');
    if (regRow) regRow.price = Number(regular_price);
  }
  if (medium_price !== undefined) {
    const medRow = dbState.pizza_sizes.find((s) => s.pizza_id === id && s.size_name === 'Medium');
    if (medRow) medRow.price = Number(medium_price);
  }
  if (large_price !== undefined) {
    const lrgRow = dbState.pizza_sizes.find((s) => s.pizza_id === id && s.size_name === 'Large');
    if (lrgRow) lrgRow.price = Number(large_price);
  }

  pizza.updated_at = new Date().toISOString();

  await executeOnMySQLIfConnected(
    'UPDATE pizzas SET category_id=?, name=?, slug=?, description=?, image_url=?, base_price=?, is_veg=?, spice_level=?, is_popular=?, is_best_seller=?, is_available=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [
      pizza.category_id,
      pizza.name,
      pizza.slug,
      pizza.description,
      pizza.image_url,
      pizza.base_price,
      pizza.is_veg,
      pizza.spice_level,
      pizza.is_popular,
      pizza.is_best_seller,
      pizza.is_available,
      pizza.id,
    ]
  );

  return res.json({
    success: true,
    message: 'Pizza and size pricing updated in MySQL.',
    pizza: getEnrichedPizza(pizza),
  });
}

export async function deletePizza(req: Request, res: Response) {
  const id = Number(req.params.id);
  const idx = dbState.pizzas.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Pizza not found.' });
  }

  const referencedInOrders = dbState.order_items.some((oi) => oi.pizza_id === id);
  if (referencedInOrders) {
    // Respect ON DELETE RESTRICT foreign key constraint on order_items -> mark unavailable or inform admin
    dbState.pizzas[idx].is_available = 0;
    await executeOnMySQLIfConnected('UPDATE pizzas SET is_available = 0 WHERE id = ?', [id]);
    return res.json({
      success: true,
      softArchived: true,
      message:
        'Pizza is referenced by existing historical order_items (ON DELETE RESTRICT). Marked as Unavailable to preserve order history integrity.',
    });
  }

  dbState.pizzas.splice(idx, 1);
  dbState.pizza_sizes = dbState.pizza_sizes.filter((s) => s.pizza_id !== id);
  dbState.pizza_toppings = dbState.pizza_toppings.filter((pt) => pt.pizza_id !== id);
  dbState.pizza_ingredients = dbState.pizza_ingredients.filter((pi) => pi.pizza_id !== id);

  await executeOnMySQLIfConnected('DELETE FROM pizzas WHERE id = ?', [id]);

  return res.json({
    success: true,
    message: 'Pizza and associated sizes/mappings deleted from database.',
  });
}
