export interface CategoryConfig {
  id: string;
  title: string;
  slug: string;
  iconName: string;
  childIds: string[];
}

export const CATEGORIES_CONFIG: Record<string, CategoryConfig> = {
  // 1. Fashion & Clothes (أزياء وملابس)
  cat_hbxqqz95p: {
    id: 'cat_hbxqqz95p',
    title: 'أزياء وملابس',
    slug: 'fashion',
    iconName: 'Shirt',
    childIds: ['cat_hfskvya0h', 'cat_oxh8hivt8', 'cat_5kv8y47df']
  },
  // 2. Home & Kitchen (المنزل والمطبخ)
  cat_mfufmoad0: {
    id: 'cat_mfufmoad0',
    title: 'المنزل والمطبخ',
    slug: 'home-kitchen',
    iconName: 'Home',
    childIds: ['cat_kitchenapps', 'cat_kitchentools', 'cat_6d04c5ft6', 'cat_c4tky0yxa', 'cat_2zjelnsdg', 'cat_u310yd1w3']
  },
  // 3. Health & Beauty (الصحة والجمال)
  cat_g3n6vkljv: {
    id: 'cat_g3n6vkljv',
    title: 'الصحة والجمال',
    slug: 'health-beauty',
    iconName: 'HeartPulse',
    childIds: ['cat_perfumes', 'cat_personalcare', 'cat_ut73yprlm', 'cat_bwoqca3kt', 'cat_o6r080tvi', 'cat_r826y1abx']
  },
  // 4. Electronics (الإلكترونيات)
  cat_uzhhuoj5g: {
    id: 'cat_uzhhuoj5g',
    title: 'الإلكترونيات',
    slug: 'electronics',
    iconName: 'Smartphone',
    childIds: ['cat_audio', 'cat_phones', 'cat_cameras', 'cat_accessories', 'cat_power', 'cat_zpw1oj2b7', 'cat_a3yzg81fr', 'cat_khnmn6p8m', 'cat_q4p0xeu9y', 'cat_z2p4a5gd3', 'cat_q8ol87c8r', 'cat_x2m7dey9f']
  },
  // 5. Sports & Fitness (الرياضة واللياقة)
  cat_gnkssf8aq: {
    id: 'cat_gnkssf8aq',
    title: 'الرياضة واللياقة',
    slug: 'sports',
    iconName: 'Dumbbell',
    childIds: ['cat_pqw2g6ac9', 'cat_ouk0kv2k7', 'cat_jiacjmtx3']
  },
  // 6. Bags & Luggage (الحقائب والشنط)
  cat_62fdle3jq: {
    id: 'cat_62fdle3jq',
    title: 'الحقائب والشنط',
    slug: 'bags',
    iconName: 'Briefcase',
    childIds: ['cat_backpacks', 'cat_travelcross']
  },
  // 7. Shoes (الأحذية)
  cat_5kv8y47df: {
    id: 'cat_5kv8y47df',
    title: 'الأحذية',
    slug: 'shoes',
    iconName: 'Footprints',
    childIds: []
  },
  // 8. Personal Care Appliances (أجهزة العناية الشخصية)
  cat_r826y1abx: {
    id: 'cat_r826y1abx',
    title: 'أجهزة العناية الشخصية',
    slug: 'personal-care',
    iconName: 'Sparkles',
    childIds: []
  }
};

/**
 * Normalizes and returns category display information based on ID or Title.
 */
export function getCategoryDisplay(catIdOrTitle: string) {
  if (!catIdOrTitle) {
    return CATEGORIES_CONFIG['cat_hbxqqz95p'];
  }

  const direct = CATEGORIES_CONFIG[catIdOrTitle];
  if (direct) return direct;

  const match = Object.values(CATEGORIES_CONFIG).find(c => 
    c.title.includes(catIdOrTitle) || 
    c.id === catIdOrTitle || 
    c.childIds.includes(catIdOrTitle)
  );

  return match || {
    id: catIdOrTitle,
    title: catIdOrTitle,
    slug: 'general',
    iconName: 'Tag',
    childIds: []
  };
}
