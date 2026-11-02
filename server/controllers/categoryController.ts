import { Request, Response } from 'express';
import { dbState, executeOnMySQLIfConnected } from '../services/relationalStore.ts';

export async function getAllCategories(_req: Request, res: Response) {
  const categories = [...dbState.categories]
    .sort((a, b) => a.display_order - b.display_order)
    .map((cat) => ({
      ...cat,
      pizza_count: dbState.pizzas.filter((p) => p.category_id === cat.id).length,
    }));

  return res.json({
    success: true,
    categories,
  });
}

export async function createCategory(req: Request, res: Response) {
  const { name, description, display_order, is_active } = req.body;
  const trimmedName = String(name).trim();
  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  if (dbState.categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
    return res.status(409).json({
      success: false,
      message: 'Category name already exists (UNIQUE constraint on categories.name).',
    });
  }

  const nextId = dbState.categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const now = new Date().toISOString();

  const newCat = {
    id: nextId,
    name: trimmedName,
    slug,
    description: String(description || `${trimmedName} collection`).trim(),
    display_order: Number(display_order || dbState.categories.length + 1),
    is_active: is_active === undefined ? 1 : Number(Boolean(is_active)),
    created_at: now,
    updated_at: now,
  };

  dbState.categories.push(newCat);

  await executeOnMySQLIfConnected(
    'INSERT INTO categories (id, name, slug, description, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [newCat.id, newCat.name, newCat.slug, newCat.description, newCat.display_order, newCat.is_active]
  );

  return res.status(201).json({
    success: true,
    message: 'Category created successfully.',
    category: { ...newCat, pizza_count: 0 },
  });
}

export async function updateCategory(req: Request, res: Response) {
  const id = Number(req.params.id);
  const category = dbState.categories.find((c) => c.id === id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const { name, description, display_order, is_active } = req.body;
  if (name !== undefined) {
    category.name = String(name).trim();
    category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (description !== undefined) category.description = String(description).trim();
  if (display_order !== undefined) category.display_order = Number(display_order);
  if (is_active !== undefined) category.is_active = Number(Boolean(is_active));
  category.updated_at = new Date().toISOString();

  await executeOnMySQLIfConnected(
    'UPDATE categories SET name=?, slug=?, description=?, display_order=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [category.name, category.slug, category.description, category.display_order, category.is_active, category.id]
  );

  return res.json({
    success: true,
    message: 'Category updated.',
    category: {
      ...category,
      pizza_count: dbState.pizzas.filter((p) => p.category_id === category.id).length,
    },
  });
}

export async function deleteCategory(req: Request, res: Response) {
  const id = Number(req.params.id);
  const idx = dbState.categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Category not found.' });
  }

  const linkedPizzas = dbState.pizzas.filter((p) => p.category_id === id).length;
  if (linkedPizzas > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete category: ${linkedPizzas} pizza(s) reference this category (FOREIGN KEY fk_pizzas_category ON DELETE RESTRICT). Reassign or remove those pizzas first.`,
    });
  }

  dbState.categories.splice(idx, 1);
  await executeOnMySQLIfConnected('DELETE FROM categories WHERE id = ?', [id]);

  return res.json({
    success: true,
    message: 'Category deleted.',
  });
}
