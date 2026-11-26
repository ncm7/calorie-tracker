// Built-in food database.
// Every value is an estimate for ONE serving as described in `serving`.
// kcal = calories, p = protein (g), c = carbs (g), f = fat (g).
// `units` lists other portion sizes as a multiple (m) of that one serving.
// Values come from common nutrition tables (USDA FoodData Central style values)
// and typical home/restaurant recipes. Restaurant portions vary a lot.

export const CATEGORIES = {
  nepali: 'Nepali',
  us: 'U.S. everyday',
  fusion: 'Mixed / fusion',
  drink: 'Drinks',
  basic: 'Basics & sides',
};

const G100 = [
  { l: '50 g', m: 0.5 },
  { l: '100 g', m: 1 },
  { l: '4 oz (113 g)', m: 1.13 },
  { l: '150 g', m: 1.5 },
  { l: '200 g', m: 2 },
];

export const FOODS = [
  // ---------- Nepali staples ----------
  { id: 'dal-bhat-tarkari', name: 'Dal bhat tarkari (full plate)', cat: 'nepali', serving: '1 plate: 1.5 cup rice, 1 cup dal, 1 cup tarkari, achar', kcal: 650, p: 20, c: 112, f: 14,
    aliases: ['dal bhat', 'daal bhat', 'dal bhat tarkari', 'thali', 'khana', 'bhat'], units: [{ l: 'small plate (1 cup rice)', m: 0.75 }, { l: 'plate', m: 1 }, { l: 'big plate / with refill', m: 1.5 }] },
  { id: 'bhat', name: 'Bhat (steamed white rice)', cat: 'nepali', serving: '1 cup cooked (158 g)', kcal: 205, p: 4.3, c: 45, f: 0.4,
    aliases: ['rice', 'white rice', 'bhat', 'chamal'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }, { l: '1.5 cup', m: 1.5 }, { l: '2 cups', m: 2 }] },
  { id: 'dal', name: 'Dal (lentil soup, with tempering)', cat: 'nepali', serving: '1 cup (240 ml)', kcal: 230, p: 13, c: 30, f: 6,
    aliases: ['daal', 'dal', 'masoor', 'musuro', 'lentil', 'mas ko dal', 'rahar'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup / katori', m: 1 }, { l: 'big bowl', m: 1.5 }] },
  { id: 'tarkari-mixed', name: 'Tarkari (mixed veg curry)', cat: 'nepali', serving: '1 cup', kcal: 150, p: 4, c: 18, f: 7,
    aliases: ['tarkari', 'sabji', 'sabzi', 'veg curry', 'cauli', 'cauliflower'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }] },
  { id: 'alu-tarkari', name: 'Alu tarkari (potato curry)', cat: 'nepali', serving: '1 cup', kcal: 220, p: 4, c: 30, f: 10,
    aliases: ['aloo', 'alu', 'aloo tarkari', 'potato curry', 'alu dum', 'aloo dum'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }] },
  { id: 'saag', name: 'Saag (sauteed greens)', cat: 'nepali', serving: '1 cup', kcal: 90, p: 4, c: 8, f: 5,
    aliases: ['saag', 'sag', 'rayo', 'palungo', 'spinach', 'greens'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }] },
  { id: 'achar', name: 'Achar (pickle / chutney)', cat: 'nepali', serving: '1 tbsp', kcal: 30, p: 0.5, c: 2, f: 2.5,
    aliases: ['achar', 'pickle', 'chutney', 'tomato achar', 'golbheda'], units: [{ l: 'tbsp', m: 1 }, { l: '2 tbsp', m: 2 }] },
  { id: 'chiura', name: 'Chiura (beaten rice)', cat: 'nepali', serving: '1 cup dry (~50 g)', kcal: 180, p: 3.5, c: 39, f: 0.5,
    aliases: ['chiura', 'chewra', 'beaten rice', 'poha', 'flattened rice'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }, { l: '2 cups', m: 2 }] },
  { id: 'momo-chicken', name: 'Chicken momo (steamed)', cat: 'nepali', serving: '1 piece (~30 g)', kcal: 45, p: 3, c: 5, f: 1.5,
    aliases: ['momo', 'chicken momo', 'mo:mo', 'dumpling', 'momos'], units: [{ l: 'piece', m: 1 }, { l: 'plate (10 pcs)', m: 10 }, { l: 'half plate (5 pcs)', m: 5 }] },
  { id: 'momo-buff', name: 'Buff momo (steamed)', cat: 'nepali', serving: '1 piece (~30 g)', kcal: 50, p: 3, c: 5, f: 2,
    aliases: ['buff momo', 'buffalo momo', 'buff mo:mo'], units: [{ l: 'piece', m: 1 }, { l: 'plate (10 pcs)', m: 10 }] },
  { id: 'momo-veg', name: 'Veg momo (steamed)', cat: 'nepali', serving: '1 piece (~28 g)', kcal: 35, p: 1, c: 6, f: 1,
    aliases: ['veg momo', 'vegetable momo', 'paneer momo'], units: [{ l: 'piece', m: 1 }, { l: 'plate (10 pcs)', m: 10 }] },
  { id: 'momo-fried', name: 'Fried momo (chicken)', cat: 'nepali', serving: '1 piece', kcal: 70, p: 3, c: 6, f: 4,
    aliases: ['fried momo', 'kothey momo', 'kothe', 'c momo', 'chilli momo'], units: [{ l: 'piece', m: 1 }, { l: 'plate (10 pcs)', m: 10 }] },
  { id: 'jhol-momo', name: 'Jhol momo (chicken, with soup)', cat: 'nepali', serving: '1 plate (10 pcs + jhol)', kcal: 540, p: 32, c: 55, f: 21,
    aliases: ['jhol momo', 'soup momo'], units: [{ l: 'plate', m: 1 }, { l: 'half plate', m: 0.5 }] },
  { id: 'momo-achar', name: 'Momo achar (dipping sauce)', cat: 'nepali', serving: '2 tbsp', kcal: 40, p: 1, c: 3, f: 3,
    aliases: ['momo sauce', 'momo achar', 'momo chutney'], units: [{ l: '2 tbsp', m: 1 }] },
  { id: 'chowmein-veg', name: 'Veg chowmein', cat: 'nepali', serving: '1 plate (~300 g)', kcal: 450, p: 10, c: 65, f: 16,
    aliases: ['chowmein', 'chow mein', 'chaumin', 'noodles', 'veg chowmein'], units: [{ l: 'half plate', m: 0.5 }, { l: 'plate', m: 1 }] },
  { id: 'chowmein-chicken', name: 'Chicken chowmein', cat: 'nepali', serving: '1 plate (~350 g)', kcal: 560, p: 26, c: 66, f: 20,
    aliases: ['chicken chowmein', 'chicken chow mein', 'buff chowmein', 'egg chowmein'], units: [{ l: 'half plate', m: 0.5 }, { l: 'plate', m: 1 }] },
  { id: 'thukpa', name: 'Thukpa (noodle soup, chicken)', cat: 'nepali', serving: '1 bowl', kcal: 400, p: 20, c: 55, f: 11,
    aliases: ['thukpa', 'noodle soup', 'thenthuk'], units: [{ l: 'bowl', m: 1 }] },
  { id: 'sukuti', name: 'Sukuti (dried meat)', cat: 'nepali', serving: '50 g', kcal: 170, p: 30, c: 0, f: 5,
    aliases: ['sukuti', 'dried meat', 'jerky', 'buff sukuti'], units: [{ l: '50 g', m: 1 }, { l: '100 g', m: 2 }] },
  { id: 'sukuti-sadeko', name: 'Sukuti sadeko (spiced, with oil)', cat: 'nepali', serving: '1 plate (~100 g)', kcal: 310, p: 35, c: 6, f: 16,
    aliases: ['sukuti sadeko', 'sukuti sandheko', 'sadheko'], units: [{ l: 'half plate', m: 0.5 }, { l: 'plate', m: 1 }] },
  { id: 'sel-roti', name: 'Sel roti', cat: 'nepali', serving: '1 piece (~60 g)', kcal: 230, p: 3, c: 35, f: 9,
    aliases: ['sel roti', 'sel', 'selroti'], units: [{ l: 'piece', m: 1 }, { l: '2 pieces', m: 2 }] },
  { id: 'gundruk-jhol', name: 'Gundruk ko jhol (soup)', cat: 'nepali', serving: '1 bowl', kcal: 60, p: 3, c: 7, f: 2,
    aliases: ['gundruk', 'gundruk jhol', 'gundruk soup'], units: [{ l: 'bowl', m: 1 }] },
  { id: 'gundruk-sadeko', name: 'Gundruk sadeko', cat: 'nepali', serving: '1 small plate', kcal: 110, p: 4, c: 9, f: 6,
    aliases: ['gundruk sadeko', 'gundruk achar'], units: [{ l: 'plate', m: 1 }] },
  { id: 'kwati', name: 'Kwati (mixed bean soup)', cat: 'nepali', serving: '1 bowl (1 cup)', kcal: 230, p: 13, c: 32, f: 6,
    aliases: ['kwati', 'quati', 'bean soup', 'mixed beans'], units: [{ l: 'bowl', m: 1 }, { l: 'big bowl', m: 1.5 }] },
  { id: 'alu-tama', name: 'Alu tama (bamboo shoot curry)', cat: 'nepali', serving: '1 bowl (1 cup)', kcal: 180, p: 5, c: 20, f: 9,
    aliases: ['alu tama', 'aloo tama', 'tama', 'bamboo shoot'], units: [{ l: 'bowl', m: 1 }] },
  { id: 'chatamari', name: 'Chatamari (rice crepe, egg & meat)', cat: 'nepali', serving: '1 piece', kcal: 280, p: 12, c: 38, f: 9,
    aliases: ['chatamari', 'newari pizza', 'chataamari'], units: [{ l: 'piece', m: 1 }] },
  { id: 'bara', name: 'Bara / wo (lentil patty)', cat: 'nepali', serving: '1 piece', kcal: 180, p: 9, c: 18, f: 8,
    aliases: ['bara', 'wo', 'woh', 'lentil patty'], units: [{ l: 'piece', m: 1 }] },
  { id: 'choila', name: 'Choila (spiced grilled meat)', cat: 'nepali', serving: '1 plate (~100 g)', kcal: 240, p: 25, c: 4, f: 14,
    aliases: ['choila', 'chhoila', 'buff choila', 'chicken choila'], units: [{ l: 'plate', m: 1 }] },
  { id: 'sekuwa', name: 'Sekuwa (grilled skewer meat)', cat: 'nepali', serving: '100 g', kcal: 250, p: 26, c: 3, f: 15,
    aliases: ['sekuwa', 'sekua', 'skewer', 'bbq'], units: [{ l: '100 g', m: 1 }, { l: 'plate (~200 g)', m: 2 }] },
  { id: 'kukhura-masu', name: 'Kukhura ko masu (chicken curry)', cat: 'nepali', serving: '1 cup (~200 g with gravy)', kcal: 330, p: 30, c: 6, f: 20,
    aliases: ['chicken curry', 'kukhura', 'kukhura ko masu', 'masu', 'chicken masu'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }] },
  { id: 'khasi-masu', name: 'Khasi ko masu (goat curry)', cat: 'nepali', serving: '1 cup (~200 g with gravy)', kcal: 380, p: 30, c: 5, f: 26,
    aliases: ['goat curry', 'khasi', 'mutton', 'goat'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }] },
  { id: 'dhido', name: 'Dhido (buckwheat/millet porridge)', cat: 'nepali', serving: '1 cup', kcal: 220, p: 6, c: 45, f: 1.5,
    aliases: ['dhido', 'dhindo'], units: [{ l: 'cup', m: 1 }] },
  { id: 'roti', name: 'Roti / chapati', cat: 'nepali', serving: '1 piece (~40 g)', kcal: 120, p: 3, c: 18, f: 3.7,
    aliases: ['roti', 'chapati', 'chapatti', 'phulka'], units: [{ l: 'piece', m: 1 }, { l: '2 pieces', m: 2 }, { l: '3 pieces', m: 3 }] },
  { id: 'puri', name: 'Puri (fried bread)', cat: 'nepali', serving: '1 piece', kcal: 100, p: 2, c: 12, f: 5,
    aliases: ['puri', 'poori'], units: [{ l: 'piece', m: 1 }] },
  { id: 'samosa', name: 'Samosa', cat: 'nepali', serving: '1 piece', kcal: 260, p: 4, c: 30, f: 14,
    aliases: ['samosa', 'singada'], units: [{ l: 'piece', m: 1 }] },
  { id: 'yomari', name: 'Yomari', cat: 'nepali', serving: '1 piece', kcal: 200, p: 3, c: 40, f: 3,
    aliases: ['yomari'], units: [{ l: 'piece', m: 1 }] },
  { id: 'aloo-sandheko', name: 'Alu sadeko (spiced potato salad)', cat: 'nepali', serving: '1 plate', kcal: 220, p: 3, c: 28, f: 11,
    aliases: ['alu sadeko', 'aloo sadeko', 'potato achar', 'aloo achar'], units: [{ l: 'plate', m: 1 }] },
  { id: 'egg-curry', name: 'Anda curry (egg curry, 2 eggs)', cat: 'nepali', serving: '1 bowl', kcal: 280, p: 14, c: 8, f: 21,
    aliases: ['egg curry', 'anda curry', 'anda'], units: [{ l: 'bowl', m: 1 }] },
  { id: 'paneer-curry', name: 'Paneer curry', cat: 'nepali', serving: '1 cup', kcal: 380, p: 17, c: 12, f: 29,
    aliases: ['paneer', 'paneer curry', 'matar paneer'], units: [{ l: 'cup', m: 1 }] },

  // ---------- Drinks ----------
  { id: 'masala-chiya', name: 'Nepali masala chiya (milk, 2 tsp sugar)', cat: 'drink', serving: '1 cup (~200 ml)', kcal: 110, p: 3.5, c: 15, f: 4,
    aliases: ['chiya', 'chai', 'masala chiya', 'milk tea', 'dudh chiya', 'tea'], units: [{ l: 'cup', m: 1 }, { l: 'big mug', m: 1.5 }] },
  { id: 'chiya-no-sugar', name: 'Milk chiya, no sugar', cat: 'drink', serving: '1 cup', kcal: 75, p: 3.5, c: 6, f: 4,
    aliases: ['chiya no sugar', 'sugar free chiya', 'unsweetened chai'], units: [{ l: 'cup', m: 1 }] },
  { id: 'black-tea', name: 'Black tea / kalo chiya (no sugar)', cat: 'drink', serving: '1 cup', kcal: 2, p: 0, c: 0.5, f: 0,
    aliases: ['black tea', 'kalo chiya', 'green tea'], units: [{ l: 'cup', m: 1 }] },
  { id: 'lassi', name: 'Lassi (sweet)', cat: 'drink', serving: '1 glass (300 ml)', kcal: 250, p: 8, c: 38, f: 7,
    aliases: ['lassi', 'mohi'], units: [{ l: 'glass', m: 1 }] },
  { id: 'coffee-black', name: 'Coffee, black', cat: 'drink', serving: '1 cup (12 oz)', kcal: 5, p: 0.3, c: 0, f: 0,
    aliases: ['coffee', 'black coffee', 'americano', 'cold brew', 'espresso'], units: [{ l: 'cup', m: 1 }] },
  { id: 'coffee-milk', name: 'Coffee with milk (2 tbsp whole milk)', cat: 'drink', serving: '1 cup (12 oz)', kcal: 25, p: 1.3, c: 1.6, f: 1.2,
    aliases: ['coffee with milk', 'coffee milk', 'cafe au lait'], units: [{ l: 'cup', m: 1 }] },
  { id: 'creamer', name: 'Coffee creamer (flavored)', cat: 'drink', serving: '1 tbsp', kcal: 35, p: 0, c: 5, f: 1.5,
    aliases: ['creamer', 'coffee mate', 'flavored creamer', 'half and half'], units: [{ l: 'tbsp', m: 1 }, { l: '2 tbsp', m: 2 }] },
  { id: 'latte', name: 'Latte (whole milk, 16 oz)', cat: 'drink', serving: '1 grande (16 oz)', kcal: 220, p: 12, c: 18, f: 11,
    aliases: ['latte', 'cappuccino', 'flat white', 'starbucks latte'], units: [{ l: '12 oz', m: 0.75 }, { l: '16 oz', m: 1 }, { l: '20 oz', m: 1.3 }] },
  { id: 'milk-whole', name: 'Whole milk', cat: 'drink', serving: '1 cup (240 ml)', kcal: 150, p: 8, c: 12, f: 8,
    aliases: ['milk', 'whole milk', 'dudh'], units: [{ l: 'cup', m: 1 }] },
  { id: 'milk-2', name: '2% milk', cat: 'drink', serving: '1 cup (240 ml)', kcal: 122, p: 8, c: 12, f: 4.8,
    aliases: ['2% milk', 'reduced fat milk', 'low fat milk'], units: [{ l: 'cup', m: 1 }] },
  { id: 'oj', name: 'Orange juice', cat: 'drink', serving: '1 cup (240 ml)', kcal: 112, p: 1.7, c: 26, f: 0.5,
    aliases: ['orange juice', 'oj', 'juice'], units: [{ l: 'cup', m: 1 }] },
  { id: 'soda', name: 'Soda (regular)', cat: 'drink', serving: '1 can (12 oz)', kcal: 150, p: 0, c: 39, f: 0,
    aliases: ['soda', 'coke', 'pepsi', 'sprite', 'soft drink'], units: [{ l: 'can', m: 1 }, { l: '20 oz bottle', m: 1.67 }] },
  { id: 'beer', name: 'Beer (regular)', cat: 'drink', serving: '1 can (12 oz)', kcal: 150, p: 1.6, c: 13, f: 0,
    aliases: ['beer', 'gorkha', 'lager'], units: [{ l: 'can', m: 1 }, { l: 'pint (16 oz)', m: 1.33 }] },

  // ---------- U.S. everyday ----------
  { id: 'chicken-breast', name: 'Chicken breast (grilled, skinless)', cat: 'us', serving: '100 g cooked', kcal: 165, p: 31, c: 0, f: 3.6,
    aliases: ['chicken breast', 'grilled chicken', 'chicken', 'baked chicken'], units: [...G100, { l: '1 breast (~170 g)', m: 1.7 }] },
  { id: 'chicken-thigh', name: 'Chicken thigh (skinless, cooked)', cat: 'us', serving: '100 g cooked', kcal: 209, p: 26, c: 0, f: 10.9,
    aliases: ['chicken thigh', 'thigh', 'thighs'], units: [...G100, { l: '1 thigh (~85 g)', m: 0.85 }] },
  { id: 'rotisserie', name: 'Rotisserie chicken (with skin)', cat: 'us', serving: '100 g', kcal: 215, p: 27, c: 0, f: 11,
    aliases: ['rotisserie', 'rotisserie chicken', 'costco chicken'], units: [...G100, { l: '1/4 chicken (~200 g)', m: 2 }] },
  { id: 'salmon', name: 'Salmon (cooked)', cat: 'us', serving: '100 g', kcal: 206, p: 22, c: 0, f: 12,
    aliases: ['salmon', 'fish'], units: G100 },
  { id: 'ground-beef', name: 'Ground beef 85/15 (cooked)', cat: 'us', serving: '100 g', kcal: 250, p: 26, c: 0, f: 15,
    aliases: ['ground beef', 'beef', 'mince', 'keema'], units: G100 },
  { id: 'brown-rice', name: 'Brown rice (cooked)', cat: 'us', serving: '1 cup (195 g)', kcal: 215, p: 5, c: 45, f: 1.8,
    aliases: ['brown rice'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }] },
  { id: 'quinoa', name: 'Quinoa (cooked)', cat: 'us', serving: '1 cup (185 g)', kcal: 222, p: 8, c: 39, f: 3.6,
    aliases: ['quinoa'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup', m: 1 }] },
  { id: 'pasta', name: 'Pasta (cooked, plain)', cat: 'us', serving: '1 cup (140 g)', kcal: 220, p: 8, c: 43, f: 1.3,
    aliases: ['pasta', 'spaghetti', 'penne', 'macaroni'], units: [{ l: 'cup', m: 1 }, { l: '2 cups', m: 2 }] },
  { id: 'greek-yogurt-0', name: 'Greek yogurt, nonfat plain', cat: 'us', serving: '1 cup (170 g)', kcal: 100, p: 17, c: 6, f: 0.7,
    aliases: ['greek yogurt', 'yogurt', 'fage', 'chobani', 'dahi'], units: [{ l: '1/2 cup', m: 0.5 }, { l: 'cup (170 g)', m: 1 }] },
  { id: 'greek-yogurt-2', name: 'Greek yogurt, 2% plain', cat: 'us', serving: '1 cup (170 g)', kcal: 150, p: 20, c: 8, f: 4,
    aliases: ['2% greek yogurt'], units: [{ l: 'cup (170 g)', m: 1 }] },
  { id: 'whey-water', name: 'Protein shake (1 scoop whey, water)', cat: 'us', serving: '1 shake', kcal: 120, p: 24, c: 3, f: 1.5,
    aliases: ['protein shake', 'whey', 'protein', 'shake', 'protein powder'], units: [{ l: '1 scoop', m: 1 }, { l: '2 scoops', m: 2 }] },
  { id: 'whey-milk', name: 'Protein shake (1 scoop whey, 1 cup whole milk)', cat: 'us', serving: '1 shake', kcal: 270, p: 32, c: 15, f: 9.5,
    aliases: ['protein shake with milk', 'whey with milk'], units: [{ l: 'shake', m: 1 }] },
  { id: 'rtd-shake', name: 'Ready-to-drink protein shake (30 g)', cat: 'us', serving: '1 bottle (11 oz)', kcal: 160, p: 30, c: 5, f: 3,
    aliases: ['premier protein', 'fairlife', 'core power', 'protein drink'], units: [{ l: 'bottle', m: 1 }] },
  { id: 'egg', name: 'Egg (boiled or poached)', cat: 'us', serving: '1 large egg', kcal: 72, p: 6.3, c: 0.4, f: 4.8,
    aliases: ['egg', 'eggs', 'boiled egg', 'anda'], units: [{ l: 'egg', m: 1 }, { l: '2 eggs', m: 2 }, { l: '3 eggs', m: 3 }] },
  { id: 'egg-fried', name: 'Egg (fried or scrambled, with oil/butter)', cat: 'us', serving: '1 large egg', kcal: 95, p: 6.3, c: 0.5, f: 7.3,
    aliases: ['fried egg', 'scrambled egg', 'omelette', 'omelet', 'scrambled eggs'], units: [{ l: 'egg', m: 1 }, { l: '2 eggs', m: 2 }, { l: '3 eggs', m: 3 }] },
  { id: 'avocado-toast', name: 'Avocado toast (1 slice, half avocado)', cat: 'us', serving: '1 slice', kcal: 280, p: 6, c: 28, f: 17,
    aliases: ['avocado toast', 'avo toast'], units: [{ l: 'slice', m: 1 }, { l: '2 slices', m: 2 }] },
  { id: 'avocado', name: 'Avocado', cat: 'us', serving: '1/2 medium (~70 g)', kcal: 115, p: 1.4, c: 6, f: 10.5,
    aliases: ['avocado', 'avo', 'guacamole'], units: [{ l: 'half', m: 1 }, { l: 'whole', m: 2 }] },
  { id: 'oats', name: 'Oats (rolled, cooked in water)', cat: 'us', serving: '1/2 cup dry (40 g)', kcal: 150, p: 5, c: 27, f: 2.5,
    aliases: ['oats', 'oatmeal', 'porridge', 'overnight oats'], units: [{ l: '1/2 cup dry', m: 1 }, { l: '1 cup dry', m: 2 }] },
  { id: 'burrito-bowl', name: 'Burrito bowl (chicken, rice, beans, salsa, cheese)', cat: 'us', serving: '1 bowl (Chipotle-style)', kcal: 660, p: 52, c: 72, f: 20,
    aliases: ['burrito bowl', 'chipotle bowl', 'chipotle', 'bowl', 'qdoba'], units: [{ l: 'bowl', m: 1 }, { l: 'bowl, double meat', m: 1.27 }] },
  { id: 'guac-side', name: 'Guacamole (restaurant side)', cat: 'us', serving: '1 side (4 oz)', kcal: 230, p: 2, c: 8, f: 22,
    aliases: ['guac', 'guacamole side'], units: [{ l: 'side', m: 1 }] },
  { id: 'burrito', name: 'Chicken burrito (restaurant)', cat: 'us', serving: '1 burrito', kcal: 1000, p: 55, c: 115, f: 33,
    aliases: ['burrito', 'chicken burrito'], units: [{ l: 'burrito', m: 1 }] },
  { id: 'cheeseburger', name: 'Cheeseburger (fast food, single)', cat: 'us', serving: '1 burger', kcal: 300, p: 15, c: 32, f: 13,
    aliases: ['cheeseburger', 'burger', 'mcdonalds burger'], units: [{ l: 'burger', m: 1 }] },
  { id: 'burger-restaurant', name: 'Burger (restaurant, with cheese)', cat: 'us', serving: '1 burger', kcal: 750, p: 40, c: 45, f: 44,
    aliases: ['restaurant burger', 'big burger', 'smash burger', 'double burger', 'big mac'], units: [{ l: 'burger', m: 1 }] },
  { id: 'chicken-sandwich', name: 'Chicken sandwich (fast food, fried)', cat: 'us', serving: '1 sandwich', kcal: 440, p: 29, c: 41, f: 18,
    aliases: ['chicken sandwich', 'chick fil a', 'chick-fil-a', 'spicy chicken sandwich'], units: [{ l: 'sandwich', m: 1 }] },
  { id: 'turkey-sandwich', name: 'Turkey sandwich (deli)', cat: 'us', serving: '1 sandwich', kcal: 400, p: 25, c: 45, f: 12,
    aliases: ['turkey sandwich', 'deli sandwich', 'sandwich', 'sub'], units: [{ l: 'sandwich', m: 1 }] },
  { id: 'subway-6', name: 'Subway 6" turkey (no cheese/mayo)', cat: 'us', serving: '1 sub', kcal: 280, p: 18, c: 46, f: 3.5,
    aliases: ['subway', '6 inch'], units: [{ l: '6 inch', m: 1 }, { l: 'footlong', m: 2 }] },
  { id: 'fries', name: 'French fries (medium)', cat: 'us', serving: '1 medium', kcal: 320, p: 5, c: 43, f: 15,
    aliases: ['fries', 'french fries', 'chips'], units: [{ l: 'small', m: 0.7 }, { l: 'medium', m: 1 }, { l: 'large', m: 1.5 }] },
  { id: 'pizza', name: 'Pizza, cheese (large slice)', cat: 'us', serving: '1 slice', kcal: 285, p: 12, c: 36, f: 10,
    aliases: ['pizza', 'pizza slice', 'pepperoni pizza'], units: [{ l: 'slice', m: 1 }, { l: '2 slices', m: 2 }, { l: '3 slices', m: 3 }] },
  { id: 'nuggets', name: 'Chicken nuggets (6 pc)', cat: 'us', serving: '6 pieces', kcal: 270, p: 14, c: 16, f: 17,
    aliases: ['nuggets', 'chicken nuggets', 'tenders'], units: [{ l: '6 pc', m: 1 }, { l: '10 pc', m: 1.67 }] },
  { id: 'bagel-cc', name: 'Bagel with cream cheese', cat: 'us', serving: '1 bagel', kcal: 360, p: 11, c: 56, f: 10,
    aliases: ['bagel', 'cream cheese bagel'], units: [{ l: 'bagel', m: 1 }] },
  { id: 'pancakes', name: 'Pancakes (3, with syrup & butter)', cat: 'us', serving: '3 pancakes', kcal: 520, p: 10, c: 90, f: 14,
    aliases: ['pancakes', 'pancake', 'waffles'], units: [{ l: '3 pancakes', m: 1 }] },
  { id: 'bacon', name: 'Bacon', cat: 'us', serving: '1 slice', kcal: 43, p: 3, c: 0.1, f: 3.3,
    aliases: ['bacon'], units: [{ l: 'slice', m: 1 }, { l: '3 slices', m: 3 }] },
  { id: 'toast', name: 'Toast (whole wheat slice)', cat: 'us', serving: '1 slice', kcal: 80, p: 4, c: 14, f: 1,
    aliases: ['toast', 'bread', 'slice of bread', 'pauroti'], units: [{ l: 'slice', m: 1 }, { l: '2 slices', m: 2 }] },
  { id: 'pb', name: 'Peanut butter', cat: 'us', serving: '2 tbsp (32 g)', kcal: 190, p: 7, c: 7, f: 16,
    aliases: ['peanut butter', 'pb'], units: [{ l: '1 tbsp', m: 0.5 }, { l: '2 tbsp', m: 1 }] },
  { id: 'granola-bar', name: 'Granola / protein bar', cat: 'us', serving: '1 bar', kcal: 200, p: 10, c: 24, f: 7,
    aliases: ['protein bar', 'granola bar', 'bar', 'quest bar', 'rxbar'], units: [{ l: 'bar', m: 1 }] },
  { id: 'mac-cheese', name: 'Mac and cheese', cat: 'us', serving: '1 cup', kcal: 380, p: 14, c: 44, f: 16,
    aliases: ['mac and cheese', 'mac n cheese'], units: [{ l: 'cup', m: 1 }] },
  { id: 'fried-chicken', name: 'Fried chicken (drumstick or thigh)', cat: 'us', serving: '1 piece', kcal: 280, p: 20, c: 9, f: 18,
    aliases: ['fried chicken', 'kfc', 'popeyes'], units: [{ l: 'piece', m: 1 }, { l: '2 pieces', m: 2 }] },
  { id: 'side-salad', name: 'Side salad with dressing', cat: 'us', serving: '1 side', kcal: 150, p: 2, c: 8, f: 12,
    aliases: ['salad', 'side salad', 'green salad', 'caesar salad'], units: [{ l: 'side', m: 1 }, { l: 'big bowl', m: 2 }] },
  { id: 'chicken-salad-bowl', name: 'Grilled chicken salad (entree)', cat: 'us', serving: '1 bowl', kcal: 450, p: 38, c: 18, f: 25,
    aliases: ['chicken salad', 'sweetgreen', 'salad bowl'], units: [{ l: 'bowl', m: 1 }] },

  // ---------- Basics & sides ----------
  { id: 'ghee', name: 'Ghee', cat: 'basic', serving: '1 tsp', kcal: 45, p: 0, c: 0, f: 5,
    aliases: ['ghee', 'ghiu', 'clarified butter'], units: [{ l: 'tsp', m: 1 }, { l: 'tbsp', m: 3 }] },
  { id: 'oil', name: 'Cooking oil', cat: 'basic', serving: '1 tsp', kcal: 40, p: 0, c: 0, f: 4.5,
    aliases: ['oil', 'tel', 'mustard oil', 'olive oil'], units: [{ l: 'tsp', m: 1 }, { l: 'tbsp', m: 3 }] },
  { id: 'butter', name: 'Butter', cat: 'basic', serving: '1 tsp', kcal: 34, p: 0, c: 0, f: 3.8,
    aliases: ['butter'], units: [{ l: 'tsp', m: 1 }, { l: 'tbsp', m: 3 }] },
  { id: 'sugar', name: 'Sugar', cat: 'basic', serving: '1 tsp', kcal: 16, p: 0, c: 4, f: 0,
    aliases: ['sugar', 'chini'], units: [{ l: 'tsp', m: 1 }, { l: 'tbsp', m: 3 }] },
  { id: 'banana', name: 'Banana', cat: 'basic', serving: '1 medium', kcal: 105, p: 1.3, c: 27, f: 0.4,
    aliases: ['banana', 'kera'], units: [{ l: 'medium', m: 1 }] },
  { id: 'apple', name: 'Apple', cat: 'basic', serving: '1 medium', kcal: 95, p: 0.5, c: 25, f: 0.3,
    aliases: ['apple', 'syau'], units: [{ l: 'medium', m: 1 }] },
  { id: 'cucumber', name: 'Cucumber / kakro', cat: 'basic', serving: '1 cup sliced', kcal: 16, p: 0.7, c: 3.8, f: 0.1,
    aliases: ['cucumber', 'kakro'], units: [{ l: 'cup', m: 1 }] },
  { id: 'black-beans', name: 'Black beans (cooked)', cat: 'basic', serving: '1/2 cup', kcal: 114, p: 7.6, c: 20, f: 0.5,
    aliases: ['black beans', 'beans', 'rajma', 'kidney beans'], units: [{ l: '1/2 cup', m: 1 }, { l: 'cup', m: 2 }] },
  { id: 'almonds', name: 'Almonds', cat: 'basic', serving: '1 oz (23 nuts)', kcal: 165, p: 6, c: 6, f: 14,
    aliases: ['almonds', 'nuts', 'badam', 'cashews', 'kaju'], units: [{ l: '1 oz', m: 1 }] },
  { id: 'cheese-slice', name: 'Cheese slice', cat: 'basic', serving: '1 slice', kcal: 70, p: 4, c: 1, f: 5.5,
    aliases: ['cheese', 'cheese slice', 'cheddar'], units: [{ l: 'slice', m: 1 }] },
];

// Quick-add presets. Each item is [foodId, quantity, unitIndex].
// unitIndex picks the entry in that food's `units` list (default 0 = first).
export const PRESETS = [
  // Nepali
  { id: 'p-dalbhat', name: 'Dal bhat tarkari plate', cat: 'nepali', items: [['dal-bhat-tarkari', 1, 1]] },
  { id: 'p-dalbhat-ghee', name: 'Dal bhat + 1 tsp ghee', cat: 'nepali', items: [['dal-bhat-tarkari', 1, 1], ['ghee', 1, 0]] },
  { id: 'p-dalbhat-masu', name: 'Dal bhat + chicken curry', cat: 'nepali', items: [['dal-bhat-tarkari', 1, 1], ['kukhura-masu', 1, 1]] },
  { id: 'p-momo', name: 'Chicken momo plate + achar', cat: 'nepali', items: [['momo-chicken', 1, 1], ['momo-achar', 1, 0]] },
  { id: 'p-buffmomo', name: 'Buff momo plate + achar', cat: 'nepali', items: [['momo-buff', 1, 1], ['momo-achar', 1, 0]] },
  { id: 'p-chowmein', name: 'Chicken chowmein plate', cat: 'nepali', items: [['chowmein-chicken', 1, 1]] },
  { id: 'p-khaja', name: 'Khaja set: chiura, sukuti, achar', cat: 'nepali', items: [['chiura', 1, 1], ['sukuti-sadeko', 1, 0], ['aloo-sandheko', 1, 0]] },
  { id: 'p-chiura-chiya', name: 'Chiura + masala chiya', cat: 'nepali', items: [['chiura', 1, 1], ['masala-chiya', 1, 0]] },
  { id: 'p-selroti-chiya', name: 'Sel roti + masala chiya', cat: 'nepali', items: [['sel-roti', 1, 0], ['masala-chiya', 1, 0]] },
  { id: 'p-roti-tarkari', name: '3 roti + alu tarkari', cat: 'nepali', items: [['roti', 1, 2], ['alu-tarkari', 1, 1]] },
  { id: 'p-chiya', name: 'Masala chiya', cat: 'drink', items: [['masala-chiya', 1, 0]] },
  // U.S.
  { id: 'p-eggs-toast', name: '2 eggs + 2 toast', cat: 'us', items: [['egg-fried', 1, 1], ['toast', 1, 1]] },
  { id: 'p-oats-yog', name: 'Oats + Greek yogurt + banana', cat: 'us', items: [['oats', 1, 0], ['greek-yogurt-0', 1, 1], ['banana', 1, 0]] },
  { id: 'p-chicken-rice', name: 'Meal prep: chicken breast + rice', cat: 'us', items: [['chicken-breast', 1, 3], ['bhat', 1, 1]] },
  { id: 'p-burrito-bowl', name: 'Chipotle-style burrito bowl', cat: 'us', items: [['burrito-bowl', 1, 0]] },
  { id: 'p-shake', name: 'Protein shake (water)', cat: 'us', items: [['whey-water', 1, 0]] },
  { id: 'p-burger-fries', name: 'Burger + medium fries', cat: 'us', items: [['cheeseburger', 1, 0], ['fries', 1, 1]] },
  { id: 'p-coffee-creamer', name: 'Coffee + creamer', cat: 'drink', items: [['coffee-black', 1, 0], ['creamer', 1, 0]] },
  // Fusion
  { id: 'p-dalbhat-grill', name: 'Dal bhat + grilled chicken (150 g)', cat: 'fusion', items: [['dal-bhat-tarkari', 1, 1], ['chicken-breast', 1, 3]] },
  { id: 'p-dalbhat-rotis', name: 'Dal bhat + rotisserie chicken (1/4)', cat: 'fusion', items: [['dal-bhat-tarkari', 1, 1], ['rotisserie', 1, 5]] },
  { id: 'p-momo-salad', name: 'Momo plate + side salad', cat: 'fusion', items: [['momo-chicken', 1, 1], ['momo-achar', 1, 0], ['side-salad', 1, 0]] },
  { id: 'p-momo-shake', name: 'Momo plate + protein shake', cat: 'fusion', items: [['momo-chicken', 1, 1], ['whey-water', 1, 0]] },
  { id: 'p-us-breakfast-chiya', name: 'Eggs, toast + masala chiya', cat: 'fusion', items: [['egg-fried', 1, 1], ['toast', 1, 1], ['masala-chiya', 1, 0]] },
  { id: 'p-avo-chiya', name: 'Avocado toast + masala chiya', cat: 'fusion', items: [['avocado-toast', 1, 0], ['masala-chiya', 1, 0]] },
  { id: 'p-oats-chiya', name: 'Oats + chiya (no sugar)', cat: 'fusion', items: [['oats', 1, 0], ['chiya-no-sugar', 1, 0]] },
  { id: 'p-quinoa-dal', name: 'Quinoa + dal + saag', cat: 'fusion', items: [['quinoa', 1, 1], ['dal', 1, 1], ['saag', 1, 1]] },
];

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));

/** Build a meal item from a database food. unitIndex picks a portion unit. */
export function itemFromFood(food, qty = 1, unitIndex = null) {
  const units = food.units && food.units.length ? food.units : [{ l: food.serving, m: 1 }];
  let ui = unitIndex;
  if (ui == null || ui < 0 || ui >= units.length) {
    ui = units.findIndex((u) => u.m === 1);
    if (ui < 0) ui = 0;
  }
  const u = units[ui];
  return {
    foodId: food.id,
    name: food.name,
    qty,
    unit: u.l,
    // per ONE of the chosen unit
    per: { kcal: food.kcal * u.m, p: food.p * u.m, c: food.c * u.m, f: food.f * u.m },
    source: 'db',
  };
}

export function itemsFromPreset(preset) {
  return preset.items
    .map(([id, qty, ui]) => (FOOD_BY_ID[id] ? itemFromFood(FOOD_BY_ID[id], qty, ui) : null))
    .filter(Boolean);
}

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9% ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Score how well a query matches a food. Higher is better, 0 = no match. */
export function matchScore(food, query) {
  const q = norm(query);
  if (!q) return 0;
  const name = norm(food.name);
  let best = 0;
  const cands = [name, ...(food.aliases || []).map(norm)];
  for (const a of cands) {
    if (a === q) best = Math.max(best, 100);
    else if (a.startsWith(q)) best = Math.max(best, 80);
    else if (a.includes(q)) best = Math.max(best, 60);
    else if (q.includes(a) && a.length >= 3) best = Math.max(best, 40 + a.length);
  }
  if (!best) {
    const words = q.split(' ').filter((w) => w.length > 2);
    const hit = words.filter((w) => cands.some((a) => a.includes(w))).length;
    if (hit) best = 10 + (20 * hit) / words.length;
  }
  return best;
}

export function searchFoods(query, extraFoods = [], limit = 20) {
  const all = [...extraFoods, ...FOODS];
  return all
    .map((f) => ({ f, s: matchScore(f, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.f);
}

const NUMBER_WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, half: 0.5, ek: 1, dui: 2, tin: 3 };

/**
 * Offline text parser: "2 eggs, 10 momo and 1 cup chiya" -> meal items.
 * Splits on commas, "and", "+", "with"; reads a leading number; matches the rest.
 */
export function parseMealText(text, extraFoods = []) {
  const parts = (text || '')
    .toLowerCase()
    .split(/,|\+|\band\b|\bwith\b|\bplus\b|;|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const items = [];
  const unmatched = [];
  for (let part of parts) {
    let qty = 1;
    const m = part.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(x\s*)?/);
    if (m) {
      qty = m[1].includes('/') ? Number(m[1].split('/')[0]) / Number(m[1].split('/')[1]) : Number(m[1]);
      part = part.slice(m[0].length);
    } else {
      const w = part.split(' ')[0];
      if (NUMBER_WORDS[w] != null) {
        qty = NUMBER_WORDS[w];
        part = part.slice(w.length).trim();
      }
    }
    // Strip common unit words, and remember them to pick a unit
    let unitHint = null;
    const um = part.match(/^(plates?|pieces?|pcs?|cups?|bowls?|slices?|tsp|tbsp|scoops?|glass(?:es)?|cans?|g|grams?|oz)\b\s*(of\s+)?/);
    if (um) {
      unitHint = um[1];
      part = part.slice(um[0].length);
    }
    const food = searchFoods(part, extraFoods, 1)[0];
    if (!food) {
      unmatched.push(part);
      continue;
    }
    const units = food.units || [];
    let ui = null;
    if (unitHint) {
      if (/^g|gram/.test(unitHint) && food.serving.includes('100 g')) {
        // grams: convert to number of 100 g servings
        const idx = units.findIndex((u) => u.l === '100 g');
        items.push(itemFromFood(food, qty / 100, idx >= 0 ? idx : null));
        continue;
      }
      const key = unitHint.replace(/s$/, '').replace(/es$/, '');
      const idx = units.findIndex((u) => u.l.toLowerCase().includes(key));
      if (idx >= 0) ui = idx;
    } else if (/piece/.test(food.serving)) {
      ui = units.findIndex((u) => u.l === 'piece');
      if (ui < 0) ui = null;
    }
    items.push(itemFromFood(food, qty, ui));
  }
  return { items, unmatched };
}
