import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "./client";
import type { Product } from "./types/product";
import type { OrderRequest } from "./order";

type OrderLine = { key: number; productId: number | ""; quantity: number };
type CreatedOrder = {
	id: number;
	status: string;
	totalPrice: number;
	createdAt: string;
	orderItems: Array<{
		id: number;
		quantity: number;
		priceAtPurchase: number;
		product: Product;
	}>;
};

export default function OrderApp() {
	const [products, setProducts] = useState<Product[]>([]);
	const [lines, setLines] = useState<OrderLine[]>([{ key: 1, productId: "", quantity: 1 }]);
	const [customerName, setCustomerName] = useState("");
	const [customerEmail, setCustomerEmail] = useState(() => sessionStorage.getItem("accountEmail") ?? "");
	const [loadingProducts, setLoadingProducts] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
	const [nextKey, setNextKey] = useState(2);
	const signedIn = Boolean(sessionStorage.getItem("accessToken"));

	useEffect(() => {
		const stylesheet = document.createElement("link");
		stylesheet.rel = "stylesheet";
		stylesheet.href = new URL("/order-feature.css", import.meta.url).href;
		stylesheet.dataset.remoteStyles = "orders";
		document.head.append(stylesheet);
		return () => stylesheet.remove();
	}, []);

	useEffect(() => {
		let active = true;
		apiRequest<Product[]>("/api/products")
			.then((result) => { if (active) setProducts(result); })
			.catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load the catalog."); })
			.finally(() => { if (active) setLoadingProducts(false); });
		return () => { active = false; };
	}, []);

	const subtotal = lines.reduce((sum, line) => {
		const product = products.find((item) => item.id === line.productId);
		return sum + (product ? Number(product.price) * line.quantity : 0);
	}, 0);

	function updateLine(key: number, values: Partial<OrderLine>) {
		setLines((current) => current.map((line) => line.key === key ? { ...line, ...values } : line));
	}

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setCreatedOrder(null);
		if (!signedIn) {
			setError("Sign in from the storefront header before placing an order.");
			return;
		}
		if (lines.some((line) => line.productId === "")) {
			setError("Choose a product for every order line.");
			return;
		}

		const request: OrderRequest = {
			customerName: customerName.trim(),
			customerEmail: customerEmail.trim(),
			orderItems: lines.map(({ productId, quantity }) => ({ productId: Number(productId), quantity })),
		};

		setSubmitting(true);
		try {
			const order = await apiRequest<CreatedOrder>("/api/orders", {
				method: "POST",
				body: JSON.stringify(request),
			});
			setCreatedOrder(order);
			setProducts((current) => current.map((product) => {
				const ordered = request.orderItems.find((line) => line.productId === product.id);
				return ordered ? { ...product, stockQuantity: product.stockQuantity - ordered.quantity } : product;
			}));
			setLines([{ key: nextKey, productId: "", quantity: 1 }]);
			setNextKey((current) => current + 1);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Could not place the order.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<section className="orders-feature">
			<div className="feature-heading">
				<div><span className="eyebrow">STORE / CHECKOUT</span><h1>Create an order</h1><p className="feature-subtitle">Choose products and quantities, then review the server-confirmed total.</p></div>
				<span className="secure-mark">{signedIn ? "AUTHENTICATED CHECKOUT" : "SIGN IN REQUIRED"}</span>
			</div>

			{createdOrder && <section className="order-receipt" aria-live="polite">
				<div className="receipt-top"><div><span className="eyebrow">ORDER CONFIRMED</span><h2>Order #{createdOrder.id}</h2></div><span className="order-status">{createdOrder.status}</span></div>
				<p className="receipt-date">{new Date(createdOrder.createdAt).toLocaleString()}</p>
				<ul>{createdOrder.orderItems.map((item) => <li key={item.id}><span>{item.product.name} × {item.quantity}</span><strong>${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}</strong></li>)}</ul>
				<div className="receipt-total"><span>Order total</span><strong>${Number(createdOrder.totalPrice).toFixed(2)}</strong></div>
			</section>}

			<form className="checkout-form" onSubmit={submit}>
				<section className="checkout-section">
					<div className="section-title"><span className="section-index">01</span><div><h2>Customer details</h2><p>Used for this order confirmation.</p></div></div>
					<div className="customer-fields">
						<label>Full name<input required autoComplete="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
						<label>Email address<input required type="email" autoComplete="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} /></label>
					</div>
				</section>

				<section className="checkout-section">
					<div className="section-title"><span className="section-index">02</span><div><h2>Order items</h2><p>Prices and availability come from the catalog.</p></div></div>
					{loadingProducts ? <p className="remote-state">Loading available products…</p> : products.length === 0 ? <p className="remote-state">No products are available to order.</p> : <div className="order-lines">
						{lines.map((line) => {
							const selected = products.find((product) => product.id === line.productId);
							return <div className="order-line" key={line.key}>
								<label className="line-product">Product<select required value={line.productId} onChange={(event) => updateLine(line.key, { productId: event.target.value ? Number(event.target.value) : "" })}><option value="">Choose a product</option>{products.map((product) => <option key={product.id} value={product.id} disabled={product.stockQuantity <= 0}>{product.name} · ${Number(product.price).toFixed(2)} · {product.stockQuantity} in stock</option>)}</select></label>
								<label className="line-quantity">Qty<input type="number" min="1" max={selected?.stockQuantity ?? undefined} step="1" required value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: Number(event.target.value) })} /></label>
								<strong className="line-total">${selected ? (Number(selected.price) * line.quantity).toFixed(2) : "0.00"}</strong>
								{lines.length > 1 && <button className="remove-line" type="button" aria-label="Remove item" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}>×</button>}
							</div>;
						})}
						<button type="button" className="add-line" onClick={() => { setLines((current) => [...current, { key: nextKey, productId: "", quantity: 1 }]); setNextKey((current) => current + 1); }}>＋ Add another item</button>
					</div>}
				</section>

				{error && <p className="checkout-error" role="alert">{error}</p>}
				<div className="checkout-submit"><div className="subtotal"><span>Estimated total</span><strong>${subtotal.toFixed(2)}</strong></div><button className="place-order" disabled={submitting || loadingProducts || products.length === 0}>{submitting ? "Placing order…" : "Place order"}<span aria-hidden="true">→</span></button></div>
			</form>
		</section>
	);
}
