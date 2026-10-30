// Catálogo de iPhone. Para cambiar precios, edita `variants`.
// Cada variante: capacidad, colores a los que aplica el precio y precio en COP.

// Valor que se suma a todos los precios de la lista antes de mostrarlos.
export const MARGIN = 200000;

// Número que recibe los pedidos por WhatsApp: indicativo 57 + celular, sin "+" ni espacios.
export const WHATSAPP_NUMBER = "573176777750";

export const COLORS = {
  black:        { name: "Negro",          hex: "#2b2b2d" },
  white:        { name: "Blanco",         hex: "#f2f2f0" },
  pink:         { name: "Rosa",           hex: "#f4c6d6" },
  teal:         { name: "Verde azulado",  hex: "#9fc7c3" },
  ultramarine:  { name: "Ultramar",       hex: "#7b8ff0" },
  softpink:     { name: "Rosa suave",     hex: "#f3d3d8" },
  lavender:     { name: "Lavanda",        hex: "#d2c4ea" },
  mistblue:     { name: "Azul niebla",    hex: "#a9bfd9" },
  sage:         { name: "Salvia",         hex: "#b8c4a5" },
  spaceblack:   { name: "Negro espacial", hex: "#232326" },
  cloudwhite:   { name: "Blanco nube",    hex: "#f4f3ef" },
  lightgold:    { name: "Dorado claro",   hex: "#ecdcbf" },
  skyblue:      { name: "Azul cielo",     hex: "#c9dbea" },
  cosmicorange: { name: "Naranja cósmico", hex: "#e8742c" },
  deepblue:     { name: "Azul profundo",  hex: "#2f3c55" },
  silver:       { name: "Plata",          hex: "#e3e4e5" },
  glacier:      { name: "Azul glaciar",   hex: "#b9d3e6" },
  burgundy:     { name: "Borgoña",        hex: "#6b2a36" },
};

export const NEW_PHONES = [
  {
    id: "18-pro-max",
    cover: "burgundy",
    name: "iPhone 18 Pro Max",
    family: "18",
    tag: "Nuevo lanzamiento",
    specs: ["Pantalla 6,9\"", "Chip A20 Pro", "Triple cámara Pro"],
    image: (c) => `img/phones/18promax-${c}.webp`,
    colors: ["black", "silver", "glacier", "burgundy"],
    variants: [
      { storage: "256GB", colors: ["black"], price: 4899000 },
      { storage: "256GB", colors: ["silver"], price: 5019000 },
      { storage: "256GB", colors: ["burgundy", "glacier"], price: 5099000 },
      { storage: "512GB", colors: ["black", "silver"], price: 5799000 },
      { storage: "512GB", colors: ["burgundy", "glacier"], price: 5949000 },
    ],
  },
  {
    id: "18-pro",
    cover: "glacier",
    name: "iPhone 18 Pro",
    family: "18",
    tag: "Nuevo lanzamiento",
    specs: ["Pantalla 6,3\"", "Chip A20 Pro", "Triple cámara Pro"],
    image: (c) => `img/phones/18pro-${c}.webp`,
    colors: ["black", "silver", "glacier", "burgundy"],
    variants: [
      { storage: "256GB", colors: ["black", "silver", "glacier"], price: 4449000 },
      { storage: "256GB", colors: ["burgundy"], price: 4649000 },
    ],
  },
  {
    id: "17-pro-max",
    name: "iPhone 17 Pro Max",
    family: "17",
    specs: ["Pantalla 6,9\"", "Chip A19 Pro", "Triple cámara Pro"],
    image: (c) => `img/phones/17promax-${c}.webp`,
    colors: ["cosmicorange", "deepblue", "silver"],
    variants: [
      { storage: "256GB", colors: ["cosmicorange", "deepblue"], price: 4149000 },
      { storage: "256GB", colors: ["silver"], price: 4349000 },
      { storage: "512GB", colors: ["cosmicorange", "deepblue", "silver"], price: 5049000 },
    ],
  },
  {
    id: "17-pro",
    name: "iPhone 17 Pro",
    family: "17",
    specs: ["Pantalla 6,3\"", "Chip A19 Pro", "Triple cámara Pro"],
    image: (c) => `img/phones/17pro-${c}.webp`,
    colors: ["cosmicorange", "deepblue", "silver"],
    variants: [
      { storage: "256GB", colors: ["cosmicorange", "deepblue"], price: 4049000 },
      { storage: "256GB", colors: ["silver"], price: 4149000 },
      { storage: "512GB", colors: ["cosmicorange", "deepblue", "silver"], price: 4599000 },
    ],
  },
  {
    id: "17-air",
    name: "iPhone Air",
    family: "17",
    specs: ["Pantalla 6,5\"", "Chip A19 Pro", "Diseño ultradelgado"],
    image: (c) => `img/phones/air-${c}.webp`,
    colors: ["skyblue", "lightgold", "cloudwhite", "spaceblack"],
    variants: [
      { storage: "256GB", colors: ["skyblue", "lightgold", "cloudwhite", "spaceblack"], price: 3579000 },
    ],
  },
  {
    id: "17",
    name: "iPhone 17",
    family: "17",
    specs: ["Pantalla 6,3\"", "Chip A19", "Doble cámara 48 MP"],
    image: (c) => `img/phones/17-${c}.webp`,
    colors: ["lavender", "mistblue", "sage", "white", "black"],
    variants: [
      { storage: "256GB", colors: ["lavender", "mistblue", "sage", "white", "black"], price: 3179000 },
    ],
  },
  {
    id: "17e",
    name: "iPhone 17e",
    family: "17",
    specs: ["Pantalla 6,1\"", "Chip A19", "Cámara 48 MP"],
    image: (c) => `img/phones/17e-${c}.webp`,
    colors: ["black", "white", "softpink"],
    variants: [
      { storage: "256GB", colors: ["black", "white", "softpink"], price: 2579000 },
    ],
  },
  {
    id: "16",
    name: "iPhone 16",
    family: "16",
    specs: ["Pantalla 6,1\"", "Chip A18", "Doble cámara 48 MP"],
    image: (c) => `img/phones/16-${c}.webp`,
    colors: ["ultramarine", "teal", "pink", "white", "black"],
    variants: [
      { storage: "128GB", colors: ["ultramarine", "teal", "pink", "white", "black"], price: 2829000 },
    ],
  },
];
