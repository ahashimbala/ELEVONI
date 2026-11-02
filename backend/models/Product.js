import mongoose from 'mongoose';

/**
 * Elevoni Farms Enhanced Product Model Schema
 * Supports multi-vendor attribution, approval workflow states,
 * stock control, and origin tracking.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be greater than or equal to 0']
    },
    subcategory: { type: String, enum: ["", "Poultry", "Cattle", "Sheep", "Goats", "Catfish", "Tilapia", "Other Fish", "Smoked Catfish", "Other Aquaculture", "Fingerlings", "Juveniles", "Broodstock", "Fish Feed", "Pond & Tank Equipment", "Pumps & Aeration", "Water Testing", "Filtration", "Fishing Nets", "Fishing Equipment", "Fish Processing", "Packaging & Storage", "Cold-chain Services", "Hatchery Services", "Aquaculture Consulting", "Fresh Fish", "Smoked Fish", "Dried Fish", "Frozen Fish"], default: "", trim: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Catfish & Aquaculture',
        'Poultry & Eggs',
        'Livestock & Meat',
        'Fishery Products & Equipment'
      ],
      default: 'Catfish & Aquaculture'
    },
    unitOfMeasure: {
      type: String,
      default: 'kg',
      enum: ['kg', 'gram', 'piece', 'crate', 'ton', 'bag', 'carton', 'litre', 'service', 'hour'],
      trim: true
    },
    species: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Species cannot exceed 80 characters']
    },
    condition: {
      type: String,
      default: '',
      enum: ['', 'Live', 'Fresh', 'Frozen', 'Smoked', 'Dried', 'Processed'],
      trim: true
    },
    productionMethod: {
      type: String,
      default: '',
      enum: ['', 'Farm-raised', 'Wild-caught', 'Free-range', 'Caged', 'Hatchery-produced', 'Other'],
      trim: true
    },
    weightRange: {
      type: String,
      default: '',
      trim: true,
      maxlength: [60, 'Weight range cannot exceed 60 characters']
    },
    sector: { type: String, enum: ['', 'Livestock', 'Aquaculture', 'Fisheries'], default: '' },
    availability: { type: String, enum: ['', 'Available', 'Pre-order', 'Seasonal', 'Out of stock'], default: '' },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative']
    },
    images: {
      type: [String],
      default: []
    },
    media: {
      type: [{
        url: { type: String, required: true, trim: true },
        type: { type: String, enum: ["image", "video"], required: true },
        publicId: { type: String, default: "" },
        alt: { type: String, default: "", trim: true, maxlength: 180 },
      }],
      default: [],
      validate: { validator: (items) => items.length <= 10, message: "A listing can contain up to 10 media items" }
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendorProfile',
      default: null // Null indicates official Elevoni Farms house products
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    originLocation: {
      state: { type: String, trim: true, default: 'FCT Abuja' },
      lga: { type: String, trim: true, default: '' }
    }
  },
  {
    timestamps: true
  }
);

// Indexing for high-performance public marketplace queries
productSchema.index({ status: 1, isAvailable: 1, category: 1 });
productSchema.index({ status: 1, isAvailable: 1, category: 1, subcategory: 1 });
productSchema.index({ vendorId: 1, status: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
