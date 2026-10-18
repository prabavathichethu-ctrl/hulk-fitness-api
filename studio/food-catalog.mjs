// Sourced ingredient values; see data/food_source_audit.json and SOURCES.md.
export const FOOD_VERSION = "hulk-foods-1.0.0";
export const FOODS = Object.freeze({
  "rice": {
    "id": "rice",
    "en": "Rice",
    "kn": "ಅಕ್ಕಿ",
    "state": "dry",
    "group": "grain",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 356.3576,
      "protein_g": 7.94,
      "fat_g": 0.52,
      "carbs_g": 78.24,
      "fibre_g": 2.81
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "A015",
      "pdf_page": 41,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 1491.0
    }
  },
  "ragi": {
    "id": "ragi",
    "en": "Ragi flour",
    "kn": "ರಾಗಿ ಹಿಟ್ಟು",
    "state": "dry",
    "group": "grain",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 320.7457,
      "protein_g": 7.16,
      "fat_g": 1.92,
      "carbs_g": 66.82,
      "fibre_g": 11.18
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "A010",
      "pdf_page": 41,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 1342.0
    }
  },
  "atta": {
    "id": "atta",
    "en": "Whole-wheat atta",
    "kn": "ಗೋಧಿ ಹಿಟ್ಟು",
    "state": "dry",
    "group": "grain",
    "allergens": [
      "gluten"
    ],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 320.2677,
      "protein_g": 10.57,
      "fat_g": 1.53,
      "carbs_g": 64.17,
      "fibre_g": 11.36
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "A019",
      "pdf_page": 42,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 1340.0
    }
  },
  "poha": {
    "id": "poha",
    "en": "Rice flakes / avalakki",
    "kn": "ಅವಲಕ್ಕಿ",
    "state": "dry",
    "group": "grain",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 353.7285,
      "protein_g": 7.44,
      "fat_g": 1.14,
      "carbs_g": 76.75,
      "fibre_g": 3.46
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "A011",
      "pdf_page": 41,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 1480.0
    }
  },
  "lentil": {
    "id": "lentil",
    "en": "Masoor dal",
    "kn": "ಮಸೂರ್ ಬೇಳೆ",
    "state": "dry",
    "group": "pulse",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 322.4187,
      "protein_g": 24.35,
      "fat_g": 0.75,
      "carbs_g": 52.53,
      "fibre_g": 10.43
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "B013",
      "pdf_page": 42,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 1349.0
    }
  },
  "chana": {
    "id": "chana",
    "en": "Whole chickpeas / chana",
    "kn": "ಕಡಲೆ",
    "state": "dry",
    "group": "pulse",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 287.0459,
      "protein_g": 18.77,
      "fat_g": 5.11,
      "carbs_g": 39.56,
      "fibre_g": 25.22
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "B002",
      "pdf_page": 42,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 1201.0
    }
  },
  "urad": {
    "id": "urad",
    "en": "Urad dal",
    "kn": "ಉದ್ದಿನ ಬೇಳೆ",
    "state": "dry",
    "group": "pulse",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 324.0918,
      "protein_g": 23.06,
      "fat_g": 1.69,
      "carbs_g": 51.0,
      "fibre_g": 11.93
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "B003",
      "pdf_page": 42,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 1356.0
    }
  },
  "spinach": {
    "id": "spinach",
    "en": "Spinach / palak",
    "kn": "ಪಾಲಕ್",
    "state": "raw",
    "group": "vegetable",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 24.3786,
      "protein_g": 2.14,
      "fat_g": 0.64,
      "carbs_g": 2.05,
      "fibre_g": 2.38
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "C033",
      "pdf_page": 45,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 102.0
    }
  },
  "carrot": {
    "id": "carrot",
    "en": "Carrot",
    "kn": "ಕ್ಯಾರೆಟ್",
    "state": "raw",
    "group": "vegetable",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 33.2218,
      "protein_g": 0.95,
      "fat_g": 0.47,
      "carbs_g": 5.55,
      "fibre_g": 4.18
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "F002",
      "pdf_page": 52,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 139.0
    }
  },
  "tomato": {
    "id": "tomato",
    "en": "Ripe tomato",
    "kn": "ಟೊಮ್ಯಾಟೊ",
    "state": "raw",
    "group": "vegetable",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 18.8815,
      "protein_g": 0.76,
      "fat_g": 0.25,
      "carbs_g": 3.2,
      "fibre_g": 1.58
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "D075",
      "pdf_page": 48,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 79.0
    }
  },
  "cucumber": {
    "id": "cucumber",
    "en": "Cucumber",
    "kn": "ಸೌತೆಕಾಯಿ",
    "state": "raw",
    "group": "vegetable",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 19.5985,
      "protein_g": 0.71,
      "fat_g": 0.16,
      "carbs_g": 3.48,
      "fibre_g": 2.14
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "D043",
      "pdf_page": 47,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 82.0
    }
  },
  "banana": {
    "id": "banana",
    "en": "Banana, Robusta",
    "kn": "ಬಾಳೆಹಣ್ಣು, ರೊಬಸ್ಟಾ",
    "state": "edible",
    "group": "fruit",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 105.1625,
      "protein_g": 1.23,
      "fat_g": 0.33,
      "carbs_g": 23.63,
      "fibre_g": 1.94
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "E012",
      "pdf_page": 49,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 440.0
    }
  },
  "guava": {
    "id": "guava",
    "en": "Guava, white flesh",
    "kn": "ಸೀಬೆಹಣ್ಣು",
    "state": "edible",
    "group": "fruit",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 32.2658,
      "protein_g": 1.44,
      "fat_g": 0.32,
      "carbs_g": 5.13,
      "fibre_g": 8.59
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "E028",
      "pdf_page": 50,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 135.0
    }
  },
  "milk": {
    "id": "milk",
    "en": "Whole cow milk",
    "kn": "ಹಸುವಿನ ಸಂಪೂರ್ಣ ಹಾಲು",
    "state": "ready",
    "group": "dairy",
    "allergens": [
      "milk"
    ],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 72.8967,
      "protein_g": 3.26,
      "fat_g": 4.48,
      "carbs_g": 4.94,
      "fibre_g": 0
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "L002",
      "pdf_page": 57,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 305.0
    }
  },
  "paneer": {
    "id": "paneer",
    "en": "Paneer",
    "kn": "ಪನೀರ್",
    "state": "ready",
    "group": "protein",
    "allergens": [
      "milk"
    ],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 305.4493,
      "protein_g": 18.86,
      "fat_g": 24.78,
      "carbs_g": 2.41,
      "fibre_g": 0
    },
    "source": {
      "dataset": "ICMR-NIN IFCT 2017",
      "code": "L003",
      "pdf_page": 57,
      "url": "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      "carbohydrate_basis": "available carbohydrate",
      "energy_kj": 1278.0
    }
  },
  "tofu": {
    "id": "tofu",
    "en": "Firm calcium-set tofu",
    "kn": "ಗಟ್ಟಿಯಾದ ಟೋಫು",
    "state": "ready",
    "group": "protein",
    "allergens": [
      "soy"
    ],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 144.0,
      "protein_g": 17.27,
      "fat_g": 8.72,
      "carbs_g": 0.48,
      "fibre_g": 2.3
    },
    "source": {
      "dataset": "USDA FoodData Central SR Legacy April 2018",
      "fdc_id": 172475,
      "url": "https://fdc.nal.usda.gov/food-details/172475/nutrients",
      "carbohydrate_basis": "carbohydrate by difference minus dietary fibre (approximation)",
      "reported_total_carbs_g": 2.78
    }
  },
  "curd": {
    "id": "curd",
    "en": "Plain whole-milk curd / yoghurt",
    "kn": "ಸಾದಾ ಸಂಪೂರ್ಣ ಹಾಲಿನ ಮೊಸರು",
    "state": "ready",
    "group": "dairy",
    "allergens": [
      "milk"
    ],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 61.0,
      "protein_g": 3.47,
      "fat_g": 3.25,
      "carbs_g": 4.66,
      "fibre_g": 0.0
    },
    "source": {
      "dataset": "USDA FoodData Central SR Legacy April 2018",
      "fdc_id": 171284,
      "url": "https://fdc.nal.usda.gov/food-details/171284/nutrients",
      "carbohydrate_basis": "carbohydrate by difference minus dietary fibre (approximation)",
      "reported_total_carbs_g": 4.66
    }
  },
  "oil": {
    "id": "oil",
    "en": "Sunflower oil",
    "kn": "ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ",
    "state": "ready",
    "group": "fat",
    "allergens": [],
    "diets": [
      "veg",
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 884.0,
      "protein_g": 0.0,
      "fat_g": 100.0,
      "carbs_g": 0,
      "fibre_g": 0.0
    },
    "source": {
      "dataset": "USDA FoodData Central SR Legacy April 2018",
      "fdc_id": 171025,
      "url": "https://fdc.nal.usda.gov/food-details/171025/nutrients",
      "carbohydrate_basis": "carbohydrate by difference minus dietary fibre (approximation)",
      "reported_total_carbs_g": 0.0
    }
  },
  "chicken": {
    "id": "chicken",
    "en": "Skinless boneless chicken breast",
    "kn": "ಚರ್ಮ ಮತ್ತು ಮೂಳೆ ಇಲ್ಲದ ಚಿಕನ್ ಬ್ರೆಸ್ಟ್",
    "state": "raw",
    "group": "protein",
    "allergens": [],
    "diets": [
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 120.0,
      "protein_g": 22.5,
      "fat_g": 2.62,
      "carbs_g": 0,
      "fibre_g": 0.0
    },
    "source": {
      "dataset": "USDA FoodData Central SR Legacy April 2018",
      "fdc_id": 171077,
      "url": "https://fdc.nal.usda.gov/food-details/171077/nutrients",
      "carbohydrate_basis": "carbohydrate by difference minus dietary fibre (approximation)",
      "reported_total_carbs_g": 0.0
    }
  },
  "egg": {
    "id": "egg",
    "en": "Whole egg, without shell",
    "kn": "ಚಿಪ್ಪು ಇಲ್ಲದ ಪೂರ್ಣ ಮೊಟ್ಟೆ",
    "state": "raw",
    "group": "protein",
    "allergens": [
      "egg"
    ],
    "diets": [
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 143.0,
      "protein_g": 12.56,
      "fat_g": 9.51,
      "carbs_g": 0.72,
      "fibre_g": 0.0
    },
    "source": {
      "dataset": "USDA FoodData Central SR Legacy April 2018",
      "fdc_id": 171287,
      "url": "https://fdc.nal.usda.gov/food-details/171287/nutrients",
      "carbohydrate_basis": "carbohydrate by difference minus dietary fibre (approximation)",
      "reported_total_carbs_g": 0.72
    }
  },
  "egg_white": {
    "id": "egg_white",
    "en": "Egg white",
    "kn": "ಮೊಟ್ಟೆಯ ಬಿಳಿಭಾಗ",
    "state": "raw",
    "group": "protein",
    "allergens": [
      "egg"
    ],
    "diets": [
      "egg",
      "nonveg"
    ],
    "per100": {
      "calories_kcal": 52.0,
      "protein_g": 10.9,
      "fat_g": 0.17,
      "carbs_g": 0.73,
      "fibre_g": 0.0
    },
    "source": {
      "dataset": "USDA FoodData Central SR Legacy April 2018",
      "fdc_id": 172183,
      "url": "https://fdc.nal.usda.gov/food-details/172183/nutrients",
      "carbohydrate_basis": "carbohydrate by difference minus dietary fibre (approximation)",
      "reported_total_carbs_g": 0.73
    }
  }
});
