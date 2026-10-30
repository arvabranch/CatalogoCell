// Catálogo inicial de iPhone: se carga en la base de datos con `npm run db:setup` y se usa como
// respaldo si el servidor no responde. Los cambios del día a día se hacen desde el panel /admin/.
// Cada variante: capacidad, colores a los que aplica el precio y precio final en COP (el que ve el cliente).

// Número que recibe los pedidos por WhatsApp: indicativo 57 + celular, sin "+" ni espacios.
export const WHATSAPP_NUMBER = "573176777750";

// Datos del responsable que aparecen en los Términos y en la Política de datos.
export const BUSINESS = {
  brand: "iPhone Colombia",
  email: "", // Correo para solicitudes de datos personales y PQR (se muestra cuando se complete)
  phone: "+57 317 677 7750",
  site: "https://iphonecolombia.arvabranch.com",
  updated: "30 de octubre de 2026",
};

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
      { storage: "256GB", colors: ["black"], price: 5099000 },
      { storage: "256GB", colors: ["silver"], price: 5219000 },
      { storage: "256GB", colors: ["burgundy", "glacier"], price: 5299000 },
      { storage: "512GB", colors: ["black", "silver"], price: 5999000 },
      { storage: "512GB", colors: ["burgundy", "glacier"], price: 6149000 },
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
      { storage: "256GB", colors: ["black", "silver", "glacier"], price: 4649000 },
      { storage: "256GB", colors: ["burgundy"], price: 4849000 },
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
      { storage: "256GB", colors: ["cosmicorange", "deepblue"], price: 4349000 },
      { storage: "256GB", colors: ["silver"], price: 4549000 },
      { storage: "512GB", colors: ["cosmicorange", "deepblue", "silver"], price: 5249000 },
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
      { storage: "256GB", colors: ["cosmicorange", "deepblue"], price: 4249000 },
      { storage: "256GB", colors: ["silver"], price: 4349000 },
      { storage: "512GB", colors: ["cosmicorange", "deepblue", "silver"], price: 4799000 },
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
      { storage: "256GB", colors: ["skyblue", "lightgold", "cloudwhite", "spaceblack"], price: 3779000 },
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
      { storage: "256GB", colors: ["lavender", "mistblue", "sage", "white", "black"], price: 3379000 },
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
      { storage: "256GB", colors: ["black", "white", "softpink"], price: 2779000 },
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
      { storage: "128GB", colors: ["ultramarine", "teal", "pink", "white", "black"], price: 3029000 },
    ],
  },
];
