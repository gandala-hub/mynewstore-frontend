# MyNewStore Frontend

MyNewStore is a small online-store frontend built as a host application and two
independently built React micro-frontends. The host provides the storefront
navigation and authentication UI; the Products and Orders remotes provide the
catalog and checkout features. All three frontend applications call the
MyNewStore Spring Boot REST API.

## Architecture

```text
Browser
  └── Host storefront (Vite :5173)
        ├── Products remote (Vite preview :4174)
        ├── Orders remote   (Vite preview :4175)
        └── Spring Boot REST API (:8080)
              └── PostgreSQL database (local or Supabase)
```

The host uses **Webpack Module Federation-compatible federation** through
`@originjs/vite-plugin-federation` to load the remotes at runtime. It fetches
the remote entry points from:

- `http://localhost:4174/assets/remoteEntry.js` for Products
- `http://localhost:4175/assets/remoteEntry.js` for Orders

The remote preview ports are intentional: the host configuration points to
these built preview servers, not the remotes' Vite development ports (5174 and
5175).

There are **three frontend applications** in this repository: one host and
two remote apps. The companion
[Spring Boot API repository](https://github.com/gandala-hub/mynewstore-springboot-apis)
is one backend application exposing authentication, products, and orders APIs;
it is not three separately deployed backend microservices. Running the full
local application requires four app processes (the three frontends and the
API) plus an available PostgreSQL database.

## Technology

| Area | Technology |
| --- | --- |
| Language | TypeScript 6 (`~6.0.2`) and JavaScript |
| UI framework | React 19 (`^19.2.8`), React DOM 19 (`^19.2.8`) |
| Frontend tooling | Vite 8 (`^8.3.0`), `@vitejs/plugin-react` (`^6.1.1`) |
| Micro-frontend integration | `@originjs/vite-plugin-federation` (`^1.4.1`) |
| Linter | Oxlint (`^1.81.0`) |
| Backend | Java 25, Spring Boot 4.1.1, Spring MVC, Spring Security, Spring Data JPA |
| Database | PostgreSQL |
| Backend authentication | JWT bearer tokens |

The frontend package versions above are the ranges specified in each
application's `package.json`; `package-lock.json` records the exact resolved
versions used by `npm ci`.

## Requirements

For the frontend:

- Git
- Node.js **20.19 or newer in the 20.x line, or 22.12 or newer** (required by
  the Vite/Oxlint toolchain)
- npm, included with Node.js
- Visual Studio Code (optional; recommended for the instructions below)

For the complete local storefront:

- JDK 25
- The backend repository's included Maven Wrapper (no separate Maven install
  required)
- A PostgreSQL database. The backend README describes configuring a Supabase
  PostgreSQL project for local development.
- Internet access for the first `npm ci` and Maven Wrapper runs

## Clone the repositories

From the directory where you keep your projects:

```sh
git clone https://github.com/gandala-hub/mynewstore-frontend.git
git clone https://github.com/gandala-hub/mynewstore-springboot-apis.git
```

Open the frontend folder in VS Code:

```sh
cd mynewstore-frontend
code .
```

If `code` is not on your PATH, use **File → Open Folder** in VS Code. Open
four integrated terminals (Terminal → New Terminal); use the commands below
in separate terminals and leave each running.

## Configure and start the Spring Boot API

The frontend defaults to `http://localhost:8080`. Start the API before using
the storefront. In one terminal, switch to the separately cloned backend
repository:

```sh
cd ../mynewstore-springboot-apis
```

Configure the database and a local JWT signing key in that same terminal.
Replace the database placeholders with the host, port, database, username,
and password from your PostgreSQL provider's connection details:

```sh
export SPRING_DATASOURCE_URL='jdbc:postgresql://<host>:<port>/<database>?sslmode=require'
export SPRING_DATASOURCE_USERNAME='<database-username>'
export SPRING_DATASOURCE_PASSWORD='<database-password>'
export JWT_SECRET_BASE64="$(openssl rand -base64 32)"
```

Keep database credentials and signing keys private; do not commit them to
either repository. The variables must be set in the same terminal/process
that starts the API. For a local PostgreSQL server, use its connection URL
and omit `?sslmode=require` if SSL is not configured.

Start the backend:

```sh
./mvnw spring-boot:run
```

The API listens on `http://localhost:8080`. Keep this terminal open. Stop the
process with **Ctrl+C**. On Windows PowerShell, use `.\mvnw.cmd spring-boot:run`.

## Install and run the frontends

Each of the three frontend applications has its own `package.json` and lock
file. Run `npm ci` once in each directory after cloning or whenever its
dependencies change.

**Terminal 1 — host storefront** (from the `mynewstore-frontend` directory):

```sh
npm ci
npm run dev
```

**Terminal 2 — Products remote**:

```sh
cd products-remote
npm ci
npm run build
npm run preview
```

**Terminal 3 — Orders remote** (from the frontend repository root):

```sh
cd orders-remote
npm ci
npm run build
npm run preview
```

Once the host, both remotes, and the API are running, open
**http://localhost:5173**. The Products remote preview serves on port 4174 and
the Orders remote preview serves on port 4175. Keep all four terminals open;
stop each process with **Ctrl+C**.

If a remote's source changes, rebuild that remote (`npm run build`) and restart
its preview server. The host's own `npm run build` creates a production build
of the host; it does not build or start the remote applications.

### Using VS Code

1. Open `mynewstore-frontend` in VS Code.
2. Open four integrated terminals and run the backend, host, Products, and
   Orders commands in the corresponding terminals above. The backend terminal
   starts in the sibling `mynewstore-springboot-apis` directory.
3. Open `http://localhost:5173` in a browser.

## Connecting to the Spring Boot APIs

Each frontend's API client uses `VITE_API_BASE_URL` if configured and otherwise
defaults to `http://localhost:8080`. To use a different backend URL, create a
`.env.local` file in **each** of the three frontend directories and set:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

Change the value to the API's reachable base URL as needed. Because the
Products and Orders remotes are built before previewing, set their value
before running `npm run build`. Vite loads these local environment files, and
`.env.local` files are ignored by Git.

The host's authentication client and both remotes' API clients use HTTP
`fetch` requests. On successful login, the host stores the access token and
email in browser `sessionStorage`; API clients send the token as a bearer
authorization header for protected requests. The backend must permit browser
CORS requests from the local host/remotes. The companion API project includes
the local development origins and API paths used here.

The frontend currently calls these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a customer |
| `POST` | `/api/auth/login` | Sign in and receive a JWT |
| `GET` | `/api/products` | Load the product catalog |
| `POST` | `/api/products` | Add a product (admin only) |
| `PUT` | `/api/products/{id}` | Update a product (admin only) |
| `DELETE` | `/api/products/{id}` | Delete a product (admin only) |
| `POST` | `/api/orders` | Create an order (signed-in user) |

For API details, database configuration, and backend troubleshooting, see the
backend repository's README.

## Using the website

### Browse products

Open the **Catalog** view. Product browsing does not require signing in. The
catalog loads products from `GET /api/products`; use the search field to
filter by name, category, or description, and **Refresh** to reload the list.

### Sign up and sign in

1. Select **Sign in** in the storefront header.
2. Choose **New here? Create an account**.
3. Enter a valid email and a password of at least eight characters, then
   select **Create account**.
4. Registration automatically signs you in. For a returning customer, use
   the sign-in form with your email and password.

The backend assigns newly registered accounts the `CUSTOMER` role. A customer
can browse products and create orders; product management is reserved for
accounts with the `ADMIN` role. Select **Sign out** in the header to end the
current browser session.

### Create an order

1. Sign in first; order placement requires an authenticated account.
2. Select **Orders** in the storefront navigation.
3. Enter the customer name and email, choose a product, and enter a quantity
   no greater than the displayed stock.
4. Use **Add another item** to add more products, then select **Place order**.
5. The page displays the order ID, status, items, and server-confirmed total
   when the API accepts the order.

The displayed subtotal is an estimate based on the catalog; the API creates
the order and supplies the confirmed receipt total.

### Create an admin account and manage products

There is no admin-signup action or role-management screen in this frontend.
Public registration always creates a customer. An authorized backend/database
operator must promote an account to admin; never add an admin role based only
on frontend changes.

For local development, first register the intended admin account through the
website, then use a trusted PostgreSQL/Supabase SQL console to promote that
account:

```sql
UPDATE app_users
SET role = 'ADMIN'
WHERE email = lower('admin@example.com');
```

Replace the example email. Confirm that exactly the intended account was
updated. Then sign out and sign in again so the API issues a token with the
updated role. With an admin account signed in, the Catalog view shows controls
to add, edit, and delete products. The API independently enforces admin
authorization for these operations.

## Development commands

Run from the relevant app directory:

```sh
npm run dev       # Start the Vite development server
npm run build     # Type-check and create a production build
npm run lint      # Run Oxlint
npm run preview   # Preview a previously built app
```

The Products remote and Orders remote use the same scripts. The host runs on
port 5173 in development. The remotes' standalone development servers use
5174 and 5175, but the host is configured to load their built preview servers
on ports 4174 and 4175.
