import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "./client";
import type { Product } from "./types/product";

type ProductDraft = Omit<Product, "id">;

function hasAdminRole() {
	const token = sessionStorage.getItem("accessToken");
	if (!token) return false;
	try {
		const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { authorities?: string[] };
		return payload.authorities?.includes("ROLE_ADMIN") ?? false;
	} catch {
		return false;
	}
}

function ProductEditor({
	initial,
	onSave,
	onCancel,
}: {
	initial: Product | null;
	onSave: (draft: ProductDraft) => Promise<void>;
	onCancel: () => void;
}) {
	const [name, setName] = useState(initial?.name ?? "");
	const [description, setDescription] = useState(initial?.description ?? "");
	const [category, setCategory] = useState(initial?.category ?? "");
	const [price, setPrice] = useState(initial ? String(initial.price) : "");
	const [stockQuantity, setStockQuantity] = useState(initial ? String(initial.stockQuantity) : "");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setSaving(true);
		try {
			await onSave({ name: name.trim(), description: description.trim(), category: category.trim(), price: Number(price), stockQuantity: Number(stockQuantity) });
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Could not save product.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<form className="product-editor" onSubmit={submit}>
			<div className="editor-heading"><div><span className="eyebrow">CATALOG EDITOR</span><h3>{initial ? "Update product" : "Add a product"}</h3></div><button type="button" className="icon-button" aria-label="Close form" onClick={onCancel}>×</button></div>
			<div className="editor-grid">
				<label>Product name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
				<label>Category<input value={category} maxLength={80} onChange={(event) => setCategory(event.target.value)} /></label>
				<label className="span-two">Description<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
				<label>Price<input type="number" min="0.01" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} /></label>
				<label>Stock quantity<input type="number" min="0" step="1" required value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} /></label>
			</div>
			{error && <p className="inline-error" role="alert">{error}</p>}
			<div className="editor-actions"><button type="button" className="button button-light" onClick={onCancel}>Cancel</button><button className="button button-green" disabled={saving}>{saving ? "Saving…" : initial ? "Save changes" : "Add product"}</button></div>
		</form>
	);
}

export default function ProductApp() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [editor, setEditor] = useState<Product | null | "new">(null);
	const [revision, setRevision] = useState(0);
	const canManage = hasAdminRole();

	useEffect(() => {
		const stylesheet = document.createElement("link");
		stylesheet.rel = "stylesheet";
		stylesheet.href = new URL("/product-feature.css", import.meta.url).href;
		stylesheet.dataset.remoteStyles = "products";
		document.head.append(stylesheet);
		return () => stylesheet.remove();
	}, []);

	useEffect(() => {
		let active = true;
		apiRequest<Product[]>("/api/products")
			.then((result) => { if (active) { setProducts(result); setError(""); } })
			.catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load products."); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [revision]);

	const visibleProducts = products.filter((product) =>
		`${product.name} ${product.category ?? ""} ${product.description ?? ""}`.toLowerCase().includes(query.toLowerCase()),
	);

	function refreshProducts() {
		setLoading(true);
		setRevision((current) => current + 1);
	}

	async function saveProduct(draft: ProductDraft) {
		if (editor && editor !== "new") {
			await apiRequest<Product>(`/api/products/${editor.id}`, { method: "PUT", body: JSON.stringify(draft) });
		} else {
			await apiRequest<void>("/api/products", { method: "POST", body: JSON.stringify(draft) });
		}
		setEditor(null);
		setLoading(true);
		setRevision((current) => current + 1);
	}

	async function deleteProduct(product: Product) {
		if (!window.confirm(`Delete “${product.name}”?`)) return;
		try {
			await apiRequest<void>(`/api/products/${product.id}`, { method: "DELETE" });
			setLoading(true);
			setRevision((current) => current + 1);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Could not delete product.");
		}
	}

	return (
		<section className="product-feature">
			<div className="feature-heading">
				<div><span className="eyebrow">STORE / INVENTORY</span><h1>Product catalog</h1><p className="feature-subtitle">Browse current stock and product details.</p></div>
				<div className="heading-actions"><span className="record-count">{products.length} items</span>{canManage && <button className="button button-green" onClick={() => setEditor("new")}>＋ Add product</button>}</div>
			</div>
			<div className="catalog-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search products" placeholder="Search name, category, description" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="button button-light" onClick={refreshProducts} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
			{!canManage && <p className="access-note">Sign in with an admin account to add, edit, or remove products.</p>}
			{editor !== null && <ProductEditor key={editor === "new" ? "new" : editor.id} initial={editor === "new" ? null : editor} onSave={saveProduct} onCancel={() => setEditor(null)} />}
			{error && <div className="notice-error" role="alert"><span>{error}</span><button className="text-button" onClick={refreshProducts}>Try again</button></div>}
			<div className="catalog-table-wrap">
				{loading ? <div className="table-state">Loading products…</div> : !error && visibleProducts.length === 0 ? <div className="table-state">{query ? "No products match your search." : "No products yet."}</div> : (
					<table className="catalog-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>IN STOCK</th>{canManage && <th><span className="visually-hidden">Actions</span></th>}</tr></thead>
						<tbody>{visibleProducts.map((product, index) => <tr key={product.id} style={{ animationDelay: `${index * 35}ms` }}>
							<td><div className="product-name-cell"><span className="product-stamp">{product.name.slice(0, 1).toUpperCase()}</span><span><strong>{product.name}</strong><small>{product.description || `SKU ${String(product.id).padStart(5, "0")}`}</small></span></div></td>
							<td><span className="category-label">{product.category || "Uncategorized"}</span></td>
							<td className="price-cell">${Number(product.price).toFixed(2)}</td>
							<td><span className={product.stockQuantity > 0 ? "stock-indicator in-stock" : "stock-indicator out-stock"}><i />{product.stockQuantity > 0 ? `${product.stockQuantity} available` : "Out of stock"}</span></td>
							{canManage && <td><div className="row-actions"><button className="text-button" onClick={() => setEditor(product)}>Edit</button><button className="text-button danger-text" onClick={() => void deleteProduct(product)}>Delete</button></div></td>}
						</tr>)}</tbody>
					</table>
				)}
			</div>
		</section>
	);
}
