/**
 * Mock Etsy data for testing without real Etsy API access
 */

export const mockShopData = {
  shop_id: 12345678,
  shop_name: "TestCraftStudio",
  user_id: 987654321,
  title: "TestCraft Studio",
  announcement: "Welcome to our test shop! All items are for testing purposes only.",
  currency_code: "USD",
  is_vacation: false,
  vacation_message: "",
  sale_message: "Thank you for visiting our test shop!",
  digital_sale_message: "",
  last_updated_tsz: Math.floor(Date.now() / 1000) - 86400,
  listing_active_count: 5,
  digital_listing_count: 0,
  login_name: "testcraftstudio",
  accepts_custom_requests: true,
  policy_welcome: "Welcome to our test shop!",
  policy_payment: "We accept all major credit cards and PayPal.",
  policy_shipping: "Free shipping on orders over $50.",
  policy_refunds: "30-day return policy.",
  policy_additional: "Please contact us with any questions!",
  policy_seller_info: "We are a test shop for development purposes.",
  policy_updated_tsz: Math.floor(Date.now() / 1000) - 2592000,
  policy_has_private_receipt_info: false,
  vacation_autoreply: "",
  url: "https://www.etsy.com/shop/testcraftstudio",
  image_url_760x100: "https://via.placeholder.com/760x100/FF6B6B/FFFFFF?text=TestCraft+Studio",
  num_favorers: 42,
  languages: ["en-US"],
  icon_url_fullxfull: "https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=TC",
  is_using_structured_policies: true,
  has_onboarded_structured_policies: true,
  include_dispute_form_link: false,
  is_direct_checkout_onboarded: true,
  is_calculated_eligible: true,
  is_opted_in_to_buyer_promise: true,
  is_shop_us_based: true,
  transaction_sold_count: 156,
  shipping_from_country_iso: "US",
  shop_location_country_iso: "US",
  review_count: 89,
  review_average: 4.8
};

export const mockListings = [
  {
    listing_id: 1234567890,
    user_id: 987654321,
    shop_id: 12345678,
    title: "Handmade Ceramic Coffee Mug - Blue Glaze",
    description: "Beautiful handmade ceramic coffee mug with a stunning blue glaze. Perfect for your morning coffee or tea. Each mug is unique and crafted with love.",
    state: "active",
    creation_timestamp: Math.floor(Date.now() / 1000) - 2592000,
    ending_timestamp: Math.floor(Date.now() / 1000) + 86400,
    original_creation_timestamp: Math.floor(Date.now() / 1000) - 2592000,
    last_modified_timestamp: Math.floor(Date.now() / 1000) - 86400,
    price: {
      amount: 2499,
      divisor: 100,
      currency_code: "USD"
    },
    quantity: 5,
    tags: ["ceramic", "coffee mug", "handmade", "blue glaze", "unique", "artisan", "kitchen", "morning coffee", "tea cup", "gift idea", "handcrafted", "pottery", "mug"],
    materials: ["ceramic clay", "blue glaze", "kiln fired", "food safe", "dishwasher safe", "microwave safe", "hand thrown", "artisan crafted", "natural materials", "eco friendly", "non toxic", "lead free", "handmade"],
    shop_section_id: 123456789,
    featured_rank: 1,
    url: "https://www.etsy.com/listing/1234567890/handmade-ceramic-coffee-mug-blue-glaze",
    views: 342,
    num_favorers: 23,
    processing_min: 3,
    processing_max: 5,
    who_made: "i_did",
    is_supply: false,
    when_made: "2020s",
    item_weight: 400,
    item_weight_unit: "g",
    item_length: 10,
    item_width: 8,
    item_height: 12,
    item_dimensions_unit: "cm",
    is_private: false,
    style: ["modern", "rustic"],
    non_taxable: false,
    is_customizable: true,
    is_digital: false,
    file_data: "",
    should_auto_renew: false,
    language: "en-US",
    has_variations: false,
    taxonomy_id: 69150467,
    taxonomy_path: ["Home & Living", "Kitchen & Dining", "Dinnerware & Serveware", "Mugs & Cups"],
    used_manufacturer: false,
    is_vintage: false,
    images: [
      {
        listing_image_id: 12345678901,
        hex_code: "#4A90E2",
        red: 74,
        green: 144,
        blue: 226,
        hue: 212,
        saturation: 73,
        brightness: 89,
        is_black_and_white: false,
        creation_timestamp: Math.floor(Date.now() / 1000) - 2592000,
        listing_id: 1234567890,
        rank: 1,
        url_75x75: "https://via.placeholder.com/75x75/4A90E2/FFFFFF?text=Mug",
        url_170x135: "https://via.placeholder.com/170x135/4A90E2/FFFFFF?text=Coffee+Mug",
        url_570xN: "https://via.placeholder.com/570xN/4A90E2/FFFFFF?text=Handmade+Ceramic+Coffee+Mug",
        url_fullxfull: "https://via.placeholder.com/800x800/4A90E2/FFFFFF?text=Beautiful+Ceramic+Mug+Blue+Glaze",
        full_height: 800,
        full_width: 800
      }
    ],
    videos: [],
    shop_name: "TestCraftStudio"
  },
  {
    listing_id: 1234567891,
    user_id: 987654321,
    shop_id: 12345678,
    title: "Vintage Style Wooden Cutting Board - Oak",
    description: "Stunning vintage-style wooden cutting board made from premium oak. Perfect for food preparation or as a beautiful serving board. Each board is sanded to perfection and treated with food-safe oil.",
    state: "active",
    creation_timestamp: Math.floor(Date.now() / 1000) - 1728000,
    ending_timestamp: Math.floor(Date.now() / 1000) + 86400,
    original_creation_timestamp: Math.floor(Date.now() / 1000) - 1728000,
    last_modified_timestamp: Math.floor(Date.now() / 1000) - 43200,
    price: {
      amount: 3599,
      divisor: 100,
      currency_code: "USD"
    },
    quantity: 3,
    tags: ["wooden cutting board", "oak", "vintage style", "kitchen", "food preparation", "serving board", "handmade", "premium wood", "kitchen gift", "chef gift", "food safe", "natural materials"],
    materials: ["oak wood", "food safe oil", "natural finish", "hand sanded", "premium quality", "sustainable wood", "non toxic", "food grade", "handcrafted", "artisan made", "eco friendly", "renewable resource", "local sourced"],
    shop_section_id: 123456790,
    featured_rank: 2,
    url: "https://www.etsy.com/listing/1234567891/vintage-style-wooden-cutting-board-oak",
    views: 198,
    num_favorers: 15,
    processing_min: 2,
    processing_max: 4,
    who_made: "i_did",
    is_supply: false,
    when_made: "2020s",
    item_weight: 800,
    item_weight_unit: "g",
    item_length: 35,
    item_width: 25,
    item_height: 3,
    item_dimensions_unit: "cm",
    is_private: false,
    style: ["vintage", "rustic"],
    non_taxable: false,
    is_customizable: true,
    is_digital: false,
    file_data: "",
    should_auto_renew: false,
    language: "en-US",
    has_variations: false,
    taxonomy_id: 69150467,
    taxonomy_path: ["Home & Living", "Kitchen & Dining", "Kitchen Tools & Utensils", "Cutting Boards"],
    used_manufacturer: false,
    is_vintage: false,
    images: [
      {
        listing_image_id: 12345678902,
        hex_code: "#8B4513",
        red: 139,
        green: 69,
        blue: 19,
        hue: 25,
        saturation: 76,
        brightness: 55,
        is_black_and_white: false,
        creation_timestamp: Math.floor(Date.now() / 1000) - 1728000,
        listing_id: 1234567891,
        rank: 1,
        url_75x75: "https://via.placeholder.com/75x75/8B4513/FFFFFF?text=Board",
        url_170x135: "https://via.placeholder.com/170x135/8B4513/FFFFFF?text=Cutting+Board",
        url_570xN: "https://via.placeholder.com/570xN/8B4513/FFFFFF?text=Vintage+Wooden+Cutting+Board",
        url_fullxfull: "https://via.placeholder.com/800x800/8B4513/FFFFFF?text=Premium+Oak+Cutting+Board",
        full_height: 800,
        full_width: 800
      }
    ],
    videos: [],
    shop_name: "TestCraftStudio"
  },
  {
    listing_id: 1234567892,
    user_id: 987654321,
    shop_id: 12345678,
    title: "Handwoven Macrame Wall Hanging - Boho Decor",
    description: "Beautiful handwoven macrame wall hanging perfect for boho home decor. Made with natural cotton rope and finished with wooden beads. Each piece is unique and adds warmth to any space.",
    state: "active",
    creation_timestamp: Math.floor(Date.now() / 1000) - 864000,
    ending_timestamp: Math.floor(Date.now() / 1000) + 86400,
    original_creation_timestamp: Math.floor(Date.now() / 1000) - 864000,
    last_modified_timestamp: Math.floor(Date.now() / 1000) - 21600,
    price: {
      amount: 4599,
      divisor: 100,
      currency_code: "USD"
    },
    quantity: 2,
    tags: ["macrame", "wall hanging", "boho decor", "handwoven", "natural cotton", "home decor", "bohemian", "artisan", "unique", "textile art", "decorative", "cotton rope"],
    materials: ["natural cotton rope", "wooden beads", "handwoven", "organic cotton", "natural fibers", "handcrafted", "artisan made", "sustainable materials", "eco friendly", "non toxic", "biodegradable", "renewable resource", "hand tied"],
    shop_section_id: 123456791,
    featured_rank: 3,
    url: "https://www.etsy.com/listing/1234567892/handwoven-macrame-wall-hanging-boho",
    views: 567,
    num_favorers: 34,
    processing_min: 5,
    processing_max: 7,
    who_made: "i_did",
    is_supply: false,
    when_made: "2020s",
    item_weight: 300,
    item_weight_unit: "g",
    item_length: 60,
    item_width: 40,
    item_height: 2,
    item_dimensions_unit: "cm",
    is_private: false,
    style: ["boho", "bohemian"],
    non_taxable: false,
    is_customizable: true,
    is_digital: false,
    file_data: "",
    should_auto_renew: false,
    language: "en-US",
    has_variations: false,
    taxonomy_id: 69150467,
    taxonomy_path: ["Home & Living", "Home Décor", "Wall Décor", "Wall Hangings"],
    used_manufacturer: false,
    is_vintage: false,
    images: [
      {
        listing_image_id: 12345678903,
        hex_code: "#F5F5DC",
        red: 245,
        green: 245,
        blue: 220,
        hue: 60,
        saturation: 56,
        brightness: 96,
        is_black_and_white: false,
        creation_timestamp: Math.floor(Date.now() / 1000) - 864000,
        listing_id: 1234567892,
        rank: 1,
        url_75x75: "https://via.placeholder.com/75x75/F5F5DC/000000?text=Macrame",
        url_170x135: "https://via.placeholder.com/170x135/F5F5DC/000000?text=Wall+Hanging",
        url_570xN: "https://via.placeholder.com/570xN/F5F5DC/000000?text=Handwoven+Macrame+Wall+Hanging",
        url_fullxfull: "https://via.placeholder.com/800x800/F5F5DC/000000?text=Boho+Macrame+Wall+Decor",
        full_height: 800,
        full_width: 800
      }
    ],
    videos: [],
    shop_name: "TestCraftStudio"
  }
];

export const mockOAuthResponse = {
  access_token: "mock_access_token_12345",
  refresh_token: "mock_refresh_token_67890",
  token_type: "Bearer",
  expires_in: 3600,
  scope: "listings_r listings_w shops_r"
};

export const mockShopInfo = {
  shop_id: mockShopData.shop_id,
  shop_name: mockShopData.shop_name,
  user_id: mockShopData.user_id,
  title: mockShopData.title,
  announcement: mockShopData.announcement,
  currency_code: mockShopData.currency_code,
  is_vacation: mockShopData.is_vacation,
  sale_message: mockShopData.sale_message,
  listing_active_count: mockShopData.listing_active_count,
  url: mockShopData.url,
  num_favorers: mockShopData.num_favorers,
  languages: mockShopData.languages,
  icon_url_fullxfull: mockShopData.icon_url_fullxfull,
  review_count: mockShopData.review_count,
  review_average: mockShopData.review_average
};

// Mock shop sections
export const mockShopSections = [
  {
    shop_section_id: 123456789,
    title: "Coffee Mugs & Drinkware",
    rank: 1,
    user_id: 987654321,
    active_listing_count: 12
  },
  {
    shop_section_id: 123456790,
    title: "Kitchen & Dining",
    rank: 2,
    user_id: 987654321,
    active_listing_count: 8
  },
  {
    shop_section_id: 123456791,
    title: "Home Decor",
    rank: 3,
    user_id: 987654321,
    active_listing_count: 15
  },
  {
    shop_section_id: 123456792,
    title: "Wall Art & Hangings",
    rank: 4,
    user_id: 987654321,
    active_listing_count: 10
  }
];

// Mock shipping profiles
export const mockShippingProfiles = [
  {
    shipping_profile_id: 111222333444,
    title: "Standard Shipping",
    user_id: 987654321,
    min_processing_days: 3,
    max_processing_days: 5,
    processing_days_display_label: "3-5 business days",
    origin_country_iso: "US",
    origin_postal_code: "90210",
    profile_type: "manual",
    domestic_handling_fee: 0,
    international_handling_fee: 500
  },
  {
    shipping_profile_id: 111222333445,
    title: "Express Shipping",
    user_id: 987654321,
    min_processing_days: 1,
    max_processing_days: 2,
    processing_days_display_label: "1-2 business days",
    origin_country_iso: "US",
    origin_postal_code: "90210",
    profile_type: "manual",
    domestic_handling_fee: 500,
    international_handling_fee: 1000
  },
  {
    shipping_profile_id: 111222333446,
    title: "Free Shipping",
    user_id: 987654321,
    min_processing_days: 5,
    max_processing_days: 7,
    processing_days_display_label: "5-7 business days",
    origin_country_iso: "US",
    origin_postal_code: "90210",
    profile_type: "manual",
    domestic_handling_fee: 0,
    international_handling_fee: 0
  }
];

// Mock production partners (for POD)
export const mockProductionPartners = [
  {
    production_partner_id: 999888777,
    partner_name: "PrintGenius",
    location: "United States"
  },
  {
    production_partner_id: 999888778,
    partner_name: "CraftMaker Pro",
    location: "United States"
  }
];

// Additional mock images for testing
export const mockImages = [
  {
    listing_image_id: 12345678901,
    hex_code: "#4A90E2",
    red: 74,
    green: 144,
    blue: 226,
    hue: 212,
    saturation: 73,
    brightness: 89,
    is_black_and_white: false,
    creation_timestamp: Math.floor(Date.now() / 1000) - 2592000,
    listing_id: 1234567890,
    rank: 1,
    url_75x75: "https://via.placeholder.com/75x75/4A90E2/FFFFFF?text=Mug+1",
    url_170x135: "https://via.placeholder.com/170x135/4A90E2/FFFFFF?text=Coffee+Mug+1",
    url_570xN: "https://via.placeholder.com/570xN/4A90E2/FFFFFF?text=Handmade+Ceramic+Coffee+Mug",
    url_fullxfull: "https://via.placeholder.com/800x800/4A90E2/FFFFFF?text=Beautiful+Ceramic+Mug+Blue+Glaze",
    full_height: 800,
    full_width: 800,
    alt_text: "Handmade ceramic coffee mug with beautiful blue glaze finish, perfect for morning coffee"
  },
  {
    listing_image_id: 12345678902,
    hex_code: "#3498DB",
    red: 52,
    green: 152,
    blue: 219,
    hue: 204,
    saturation: 70,
    brightness: 86,
    is_black_and_white: false,
    creation_timestamp: Math.floor(Date.now() / 1000) - 2592000,
    listing_id: 1234567890,
    rank: 2,
    url_75x75: "https://via.placeholder.com/75x75/3498DB/FFFFFF?text=Mug+2",
    url_170x135: "https://via.placeholder.com/170x135/3498DB/FFFFFF?text=Coffee+Mug+2",
    url_570xN: "https://via.placeholder.com/570xN/3498DB/FFFFFF?text=Ceramic+Mug+Detail",
    url_fullxfull: "https://via.placeholder.com/800x800/3498DB/FFFFFF?text=Artisan+Pottery+Mug",
    full_height: 800,
    full_width: 800,
    alt_text: "Close-up of artisan ceramic mug showing unique blue glaze pattern and craftsmanship"
  },
  {
    listing_image_id: 12345678903,
    hex_code: "#5DADE2",
    red: 93,
    green: 173,
    blue: 226,
    hue: 204,
    saturation: 69,
    brightness: 89,
    is_black_and_white: false,
    creation_timestamp: Math.floor(Date.now() / 1000) - 2592000,
    listing_id: 1234567890,
    rank: 3,
    url_75x75: "https://via.placeholder.com/75x75/5DADE2/FFFFFF?text=Mug+3",
    url_170x135: "https://via.placeholder.com/170x135/5DADE2/FFFFFF?text=Coffee+Mug+3",
    url_570xN: "https://via.placeholder.com/570xN/5DADE2/FFFFFF?text=Handcrafted+Mug",
    url_fullxfull: "https://via.placeholder.com/800x800/5DADE2/FFFFFF?text=Kitchen+Pottery+Mug",
    full_height: 800,
    full_width: 800,
    alt_text: "Handcrafted blue ceramic mug in natural kitchen setting, dishwasher and microwave safe"
  }
];

// Mock videos
export const mockVideos = [
  {
    video_id: 987654321,
    listing_id: 1234567890,
    thumbnail_url: "https://via.placeholder.com/640x360/4A90E2/FFFFFF?text=Video+Thumbnail",
    duration: 30,
    width: 1920,
    height: 1080,
    file_size: 5242880,
    creation_timestamp: Math.floor(Date.now() / 1000) - 2592000
  }
];

// Helper function to simulate API delays
export const simulateDelay = async (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to simulate API errors
export const simulateError = (errorRate: number = 0.1): boolean => {
  return Math.random() < errorRate;
};

// Mock image upload handler
export const handleMockImageUpload = (listingId: number, imageData: any): any => {
  const newImageId = Math.floor(Math.random() * 1000000000) + 10000000000;
  const newImage = {
    listing_image_id: newImageId,
    hex_code: "#CCCCCC",
    red: 204,
    green: 204,
    blue: 204,
    hue: 0,
    saturation: 0,
    brightness: 80,
    is_black_and_white: false,
    creation_timestamp: Math.floor(Date.now() / 1000),
    listing_id: listingId,
    rank: imageData.rank || 1,
    url_75x75: imageData.url_75x75 || `https://via.placeholder.com/75x75/CCCCCC/000000?text=New+Image`,
    url_170x135: imageData.url_170x135 || `https://via.placeholder.com/170x135/CCCCCC/000000?text=New+Image`,
    url_570xN: imageData.url_570xN || `https://via.placeholder.com/570xN/CCCCCC/000000?text=New+Image`,
    url_fullxfull: imageData.url_fullxfull || `https://via.placeholder.com/800x800/CCCCCC/000000?text=New+Image`,
    full_height: imageData.full_height || 800,
    full_width: imageData.full_width || 800,
    alt_text: imageData.alt_text || ""
  };
  
  // Find listing and add image
  const listing = mockListings.find(l => l.listing_id === listingId);
  if (listing) {
    listing.images.push(newImage);
  }
  
  return newImage;
};

// Mock image delete handler
export const handleMockImageDelete = (listingId: number, imageId: number): boolean => {
  const listing = mockListings.find(l => l.listing_id === listingId);
  if (listing) {
    const imageIndex = listing.images.findIndex(img => img.listing_image_id === imageId);
    if (imageIndex !== -1) {
      listing.images.splice(imageIndex, 1);
      return true;
    }
  }
  return false;
};

// Mock image reorder handler
export const handleMockImageReorder = (listingId: number, imageIds: number[]): boolean => {
  const listing = mockListings.find(l => l.listing_id === listingId);
  if (listing) {
    const reorderedImages: any[] = [];
    imageIds.forEach((imageId, index) => {
      const image = listing.images.find(img => img.listing_image_id === imageId);
      if (image) {
        image.rank = index + 1;
        reorderedImages.push(image);
      }
    });
    listing.images = reorderedImages;
    return true;
  }
  return false;
};

// Mock listing creation handler
export const handleMockListingCreate = (listingData: any): any => {
  const newListingId = Math.floor(Math.random() * 1000000000) + 1000000000;
  const newListing = {
    listing_id: newListingId,
    user_id: 987654321,
    shop_id: 12345678,
    title: listingData.title || "New Listing",
    description: listingData.description || "",
    state: listingData.state || "active",
    creation_timestamp: Math.floor(Date.now() / 1000),
    ending_timestamp: Math.floor(Date.now() / 1000) + 86400 * 365,
    original_creation_timestamp: Math.floor(Date.now() / 1000),
    last_modified_timestamp: Math.floor(Date.now() / 1000),
    price: listingData.price || { amount: 1000, divisor: 100, currency_code: "USD" },
    quantity: listingData.quantity || 1,
    tags: listingData.tags || [],
    materials: listingData.materials || [],
    shop_section_id: listingData.shop_section_id || null,
    featured_rank: 0,
    url: `https://www.etsy.com/listing/${newListingId}/new-listing`,
    views: 0,
    num_favorers: 0,
    processing_min: listingData.processing_min || 3,
    processing_max: listingData.processing_max || 5,
    who_made: listingData.who_made || "i_did",
    is_supply: false,
    when_made: listingData.when_made || "2020s",
    item_weight: listingData.item_weight || null,
    item_weight_unit: listingData.item_weight_unit || null,
    item_length: listingData.item_length || null,
    item_width: listingData.item_width || null,
    item_height: listingData.item_height || null,
    item_dimensions_unit: listingData.item_dimensions_unit || null,
    is_private: false,
    style: listingData.style || [],
    non_taxable: false,
    is_customizable: listingData.is_customizable || false,
    is_digital: listingData.is_digital || false,
    file_data: "",
    should_auto_renew: listingData.should_auto_renew || false,
    language: "en-US",
    has_variations: false,
    taxonomy_id: listingData.taxonomy_id || 1,
    used_manufacturer: false,
    is_vintage: false,
    images: [],
    videos: [],
    shop_name: "TestCraftStudio"
  };
  
  mockListings.unshift(newListing);
  return newListing;
};

// Mock video upload handler
export const handleMockVideoUpload = (listingId: number, videoData: any): any => {
  const newVideoId = Math.floor(Math.random() * 1000000000) + 900000000;
  const newVideo = {
    video_id: newVideoId,
    listing_id: listingId,
    thumbnail_url: videoData.thumbnail_url || `https://via.placeholder.com/640x360/CCCCCC/000000?text=Video`,
    duration: videoData.duration || 30,
    width: videoData.width || 1920,
    height: videoData.height || 1080,
    file_size: videoData.file_size || 5242880,
    creation_timestamp: Math.floor(Date.now() / 1000)
  };
  
  const listing = mockListings.find(l => l.listing_id === listingId);
  if (listing) {
    listing.videos.push(newVideo);
  }
  
  return newVideo;
};

// Mock video delete handler
export const handleMockVideoDelete = (listingId: number, videoId: number): boolean => {
  const listing = mockListings.find(l => l.listing_id === listingId);
  if (listing) {
    const videoIndex = listing.videos.findIndex(vid => vid.video_id === videoId);
    if (videoIndex !== -1) {
      listing.videos.splice(videoIndex, 1);
      return true;
    }
  }
  return false;
};
