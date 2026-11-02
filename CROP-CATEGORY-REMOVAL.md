# Crop and Agricultural-Produce Category Removal

## Scope removed

The active platform no longer offers crop or general agricultural-produce categories. Removed category values include Grains & Cereals, Vegetables & Fruits, Tubers & Starch, Processed Agro-Goods, and Other Farm Products.

## Updated areas

- Shared category taxonomy and legacy category adapter.
- Customer marketplace category/subcategory lists and sector filters.
- Customer-facing Sell with Elevoni application options.
- Vendor portal application options and vendor product-category permissions.
- Backend vendor-focus validation and vendor-profile serialization.
- Backend product category allow-list, schema enums, sector validation and product creation defaults.
- Admin marketplace sector filters and listing visibility.
- Marketplace, homepage, vendor invitation, About, footer, cart and SEO copy.

## Remaining platform focus

- Livestock: poultry, cattle, sheep and goats.
- Aquaculture and fish farming.
- Fisheries and fish products.
- Elevoni's direct smoked-catfish catalogue.

## Existing database records

No live MongoDB connection was available, so this update does not delete historical product or vendor records. Legacy crop-category products are excluded from active marketplace and admin listing responses. Legacy `agriculture` vendor-focus values are filtered from vendor-facing/admin-facing profile responses and no longer grant product permissions. Retain historical records for audit unless a separate, approved database cleanup is requested.

## Verification

- Shared taxonomy/adapter and customer vendor-application tests: 50 passed.
- Backend/controller and model syntax checks: passed.
- Backend integration tests requiring installed backend dependencies were not run in this environment.
- Production frontend/vendor builds were not run in this environment.
