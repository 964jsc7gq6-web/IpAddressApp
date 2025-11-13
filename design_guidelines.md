# Design Guidelines - App Ipê

## Design Approach

**Selected System:** Material Design with Linear-inspired minimalism
**Rationale:** Material Design excels at data-heavy applications with strong visual hierarchy and clear interaction patterns. Linear's clean typography and spacing principles will enhance readability for financial data and dashboard metrics.

**Key Principles:**
- Clarity over decoration - financial data demands precision
- Mobile-first PWA optimization
- Generous whitespace for data scanning
- Distinct visual hierarchy between read/write permissions

---

## Typography

**Font Stack:** 
- Primary: Inter (Google Fonts) - headings, UI elements, navigation
- Secondary: JetBrains Mono (Google Fonts) - financial values, numbers, data tables

**Hierarchy:**
- Page Titles: Inter Bold, 2xl (36px desktop / 28px mobile)
- Section Headers: Inter Semibold, xl (24px desktop / 20px mobile)  
- Card Titles: Inter Medium, lg (20px desktop / 18px mobile)
- Body Text: Inter Regular, base (16px)
- Labels/Captions: Inter Medium, sm (14px)
- Financial Values: JetBrains Mono Medium, lg-xl (20-24px) for emphasis
- Table Data: Inter Regular, sm (14px)

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Page containers: px-4 md:px-6 lg:px-8

**Grid System:**
- Dashboard: 12-column grid on desktop, single column on mobile
- Forms: max-w-2xl centered containers
- Tables: full-width with horizontal scroll on mobile
- Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

---

## Component Library

### Navigation
**Sidebar (Desktop):**
- Fixed left sidebar, w-64
- Logo at top (p-6)
- Navigation items with icons (Heroicons) + labels
- User profile at bottom with role badge (Proprietário/Comprador)
- Active state: filled background treatment

**Mobile Nav:**
- Bottom tab bar with 4-5 primary items
- Hamburger menu for secondary items
- Role indicator in header

### Dashboard Cards
- Rounded cards (rounded-lg) with subtle elevation
- Header with title + optional action button
- Chart.js visualizations with Material Design color palette
- Stats cards in 3-column grid: number (large, JetBrains Mono) + label + trend indicator

### Data Tables
- Striped rows for readability
- Sticky header on scroll
- Action buttons (icon-only) in rightmost column
- Status badges for pago/pendente with color coding
- Responsive: cards on mobile, table on desktop (lg breakpoint)

### Forms
- Floating label pattern for inputs
- Input groups with leading icons
- Clear validation states (error/success borders + helper text)
- File upload zones: dashed border, drag-and-drop area with file type/size limits displayed
- Read-only fields for Comprador role: lighter background, no interaction cursor

### Upload Components
**File Upload Zones:**
- Large drop zone with icon, main text, and file requirements (p-8)
- File list below with preview thumbnails, filename, size, remove button
- Progress bars during upload
- Clear limit indicators ("2/3 arquivos enviados")

### Financial Components
**Parcela Cards:**
- Header: Parcela #número + vencimento date
- Body: Valor (large, JetBrains Mono) + status badge
- Footer: Comprovante attachment or upload button
- Unpaid parcelas: subtle background treatment

**Payment Status:**
- Badge component: rounded-full px-3 py-1
- Icons + text for clarity
- Positioned top-right in cards

### Buttons
**Primary Actions:** Solid fill, medium weight
**Secondary Actions:** Outlined style
**Danger Actions:** Red treatment for delete operations
**Icon Buttons:** Square (p-2) for table actions

Sizes: sm (forms), base (general), lg (primary CTAs)

### Modals & Overlays
- Centered modal with max-w-2xl
- Backdrop blur
- Header with title + close button
- Footer with action buttons (cancel left, confirm right)

---

## Dashboard Design

**Layout:**
1. Summary Stats Row: 3-4 cards showing key metrics (total parcelas, valor total, parcelas pendentes, próximo vencimento)
2. Charts Section (2-column on desktop):
   - Left: Pie chart (Parcelas pagas vs pendentes)
   - Right: Bar chart (Últimas 5 parcelas com valores)
3. Recent Activity Table: últimas transações with quick actions
4. Aluguéis + Condomínio panels below charts

**Chart Styling:**
- Clean, minimal design
- Tooltips with detailed information
- Legend positioned below charts
- Responsive sizing (full-width on mobile)

---

## Responsive Patterns

**Breakpoints:**
- Mobile: < 768px (md)
- Tablet: 768px - 1024px
- Desktop: > 1024px (lg)

**Mobile Optimizations:**
- Stack all multi-column layouts to single column
- Transform tables to card lists
- Bottom navigation bar
- Larger touch targets (min 44px)
- Collapsible sections for long forms

---

## PWA Specific

**App Shell:**
- Instant loading skeleton screens
- Persistent header with offline indicator
- Bottom navigation always visible
- Pull-to-refresh on data views

**Offline States:**
- Clear messaging when offline
- Cached data indicators
- Queue actions for sync when online

---

## Images

**Logo/Branding:**
- App Ipê logo in sidebar header (simple, clean wordmark or icon+text)

**Empty States:**
- Illustration for "Nenhum registro encontrado" (simple line art)
- Upload placeholder icons (document, image icons from Heroicons)

**Property Images:**
- Imóvel foto de capa: Display as hero in property detail view (aspect-ratio 16:9, rounded-lg)
- Gallery thumbnails for additional anexos (aspect-ratio 1:1, small rounded squares)

No large hero images needed - this is a data-focused application, not marketing.

---

## Permission-Based UI

**Proprietário (Full Access):**
- All action buttons visible
- Edit icons in tables
- Create new records buttons prominent

**Comprador (Read-Only):**
- Hide all create/edit/delete buttons
- Replace with disabled state messaging
- Show lock icons on non-editable fields
- Subtle banner: "Modo somente leitura"