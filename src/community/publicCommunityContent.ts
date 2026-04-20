export type StorefrontCommunityCategoryKey = 'cladding-tiles' | 'bricks' | 'paving' | 'breeze-blocks';

export interface CommunityPost {
  id: string;
  type: 'editorial' | 'concept' | 'built';
  title: string;
  description: string;
  mediaUrl: string;
  author: { name: string; role: string };
  category: string;
  location?: string;
  tags: string[];
  date: string;
  stats: { likes: number; saves: number; comments: number };
  relatedCategoryKeys: StorefrontCommunityCategoryKey[];
  relatedProductKeywords: string[];
}

export interface KnowledgeArticle {
  id: string;
  type: 'guide' | 'trend' | 'news' | 'tips' | 'blog';
  title: string;
  excerpt: string;
  coverImage: string;
  readTime: string;
  category: string;
  author: string;
  featured: boolean;
  date: string;
  body: string[];
  takeaways: string[];
  relatedCategoryKeys: StorefrontCommunityCategoryKey[];
  relatedProductKeywords: string[];
}

export interface Contractor {
  id: string;
  name: string;
  type: 'builder' | 'architect' | 'interior_designer' | 'landscape';
  region: string;
  city: string;
  specialties: string[];
  rating: number;
  projectCount: number;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
  verified: boolean;
}

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    type: 'editorial',
    title: 'Minimalist Industrial Loft',
    description: 'Raw beauty of exposed brick and polished concrete in a modern urban setting. Curated by the BTS Editorial team for maximum atmospheric impact.',
    mediaUrl: 'https://images.unsplash.com/photo-1536376074432-bf1217709993?w=1200&q=80',
    author: { name: 'BTS Editorial', role: 'Curator' },
    category: 'Residential',
    tags: ['Industrial', 'Minimalist', 'Brick', 'Cladding'],
    date: '2024-03-20',
    stats: { likes: 3200, saves: 1240, comments: 45 },
    relatedCategoryKeys: ['cladding-tiles', 'bricks'],
    relatedProductKeywords: ['brick', 'cladding', 'industrial', 'carbon', 'travertine'],
  },
  {
    id: 'p2',
    type: 'concept',
    title: 'Coastal Retreat Concept',
    description: 'Customer-generated in the BTS Studio. Light-toned bricks and airy textures for a beachside feel. Designed for a private client in Hermanus.',
    mediaUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    author: { name: 'Sarah Jenkins', role: 'Interior Designer' },
    category: 'Residential',
    tags: ['Coastal', 'Light', 'Cladding', 'Paving'],
    date: '2024-03-22',
    stats: { likes: 1500, saves: 850, comments: 28 },
    relatedCategoryKeys: ['cladding-tiles', 'paving'],
    relatedProductKeywords: ['coastal', 'sandstone', 'light', 'paver', 'cladding'],
  },
  {
    id: 'p3',
    type: 'built',
    title: 'The Urban Office HQ',
    description: 'Large-scale commercial facade featuring custom architectural bricks. A collaboration with Studio X resulting in this award-nominated structure.',
    mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    author: { name: 'Studio X Architects', role: 'Architectural Partner' },
    location: 'Cape Town, SA',
    category: 'Commercial',
    tags: ['Commercial', 'Office', 'Facade'],
    date: '2024-03-15',
    stats: { likes: 5600, saves: 2100, comments: 112 },
    relatedCategoryKeys: ['bricks', 'cladding-tiles'],
    relatedProductKeywords: ['face brick', 'facade', 'commercial', 'fbx', 'fbs'],
  },
  {
    id: 'p4',
    type: 'editorial',
    title: 'Terracotta Textures',
    description: 'The warmth of traditional terracotta meets contemporary design. A curated look into our Autumn collection by the BTS editorial team.',
    mediaUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80',
    author: { name: 'BTS Editorial', role: 'Curator' },
    category: 'Retail',
    tags: ['Terracotta', 'Warm', 'Breeze Block'],
    date: '2024-03-25',
    stats: { likes: 980, saves: 560, comments: 12 },
    relatedCategoryKeys: ['bricks', 'breeze-blocks'],
    relatedProductKeywords: ['terracotta', 'breeze', 'clay', 'warm'],
  },
  {
    id: 'p5',
    type: 'concept',
    title: 'Modern Farmhouse Kitchen',
    description: 'Rustic charm with sleek modern finishes. Designed in BTS Studio for a private residence with Antique White Brick as the hero material.',
    mediaUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80',
    author: { name: 'Michael Chen', role: 'Customer' },
    category: 'Residential',
    tags: ['Farmhouse', 'Kitchen', 'Feature Wall'],
    date: '2024-03-26',
    stats: { likes: 2100, saves: 1100, comments: 34 },
    relatedCategoryKeys: ['cladding-tiles', 'bricks'],
    relatedProductKeywords: ['white', 'brick', 'kitchen', 'feature wall', 'rustic'],
  },
  {
    id: 'p6',
    type: 'built',
    title: 'Heritage Home Restoration',
    description: "Preserving history with authentic heritage bricks. A meticulous restoration of a 1920s Victorian home in Johannesburg's heritage district.",
    mediaUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80',
    author: { name: 'Heritage Builders', role: 'Restoration Specialist' },
    location: 'Johannesburg, SA',
    category: 'Hospitality',
    tags: ['Heritage', 'Restoration', 'Face Brick'],
    date: '2024-03-10',
    stats: { likes: 8900, saves: 3400, comments: 245 },
    relatedCategoryKeys: ['bricks'],
    relatedProductKeywords: ['heritage', 'face brick', 'fba', 'fbx', 'restoration'],
  },
  {
    id: 'p7',
    type: 'built',
    title: 'Courtyard Clay Paver Grid',
    description: 'A compact hospitality courtyard using warm clay pavers, controlled drainage falls, and a low-maintenance stretcher layout.',
    mediaUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
    author: { name: 'BTS Field Notes', role: 'Project Desk' },
    location: 'Stellenbosch, SA',
    category: 'Landscape',
    tags: ['Paving', 'Courtyard', 'Hospitality'],
    date: '2024-04-02',
    stats: { likes: 1840, saves: 790, comments: 21 },
    relatedCategoryKeys: ['paving'],
    relatedProductKeywords: ['paver', 'paving', 'courtyard', 'zambezi', 'kalahari'],
  },
  {
    id: 'p8',
    type: 'editorial',
    title: 'Breeze Block Light Screens',
    description: 'Using terracotta screen blocks to soften sunlight, preserve airflow, and create a rhythmic facade for compact urban homes.',
    mediaUrl: 'https://images.unsplash.com/photo-1517231426071-2940212f3bc3?q=80&w=1200&auto=format&fit=crop',
    author: { name: 'BTS Studio', role: 'Material Editor' },
    category: 'Residential',
    tags: ['Breeze Block', 'Screens', 'Terracotta'],
    date: '2024-04-04',
    stats: { likes: 1280, saves: 520, comments: 18 },
    relatedCategoryKeys: ['breeze-blocks'],
    relatedProductKeywords: ['breeze', 'screen', 'wave', 'terracotta', 'block'],
  },
];

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'a1',
    type: 'trend',
    title: 'The Resurgence of Terracotta in Modern Commercial Spaces',
    excerpt: 'How leading architects are utilizing warm, earthy tones to offset cold urban environments and create inviting public spaces.',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    readTime: '5 min',
    category: 'Architecture',
    author: 'BTS Editorial',
    featured: true,
    date: '2024-03-26',
    body: [
      'Terracotta is returning to commercial architecture because it gives large spaces a warmer human scale without losing durability. In offices, restaurants, galleries, and mixed-use public areas, earthy clay tones soften glass, steel, concrete, and hard lighting.',
      'The strongest applications use terracotta as a controlled material field rather than decoration. Feature walls, breezeblock partitions, reception backdrops, and external screens can all carry warmth while still staying practical for maintenance and high foot traffic.',
      'For Brick Tile Shop projects, the key decision is tonal balance. Pair warm clay, rust, and sand tones with restrained grout, clean detailing, and stable lighting so the material reads architectural instead of rustic.'
    ],
    takeaways: [
      'Use terracotta to warm cold commercial shells.',
      'Keep grout and adjacent finishes restrained.',
      'Specify clay tones intentionally against lighting and traffic needs.'
    ],
    relatedCategoryKeys: ['bricks', 'breeze-blocks'],
    relatedProductKeywords: ['terracotta', 'brick', 'breeze', 'commercial'],
  },
  {
    id: 'a2',
    type: 'guide',
    title: 'Understanding Mortar Joints: A Technical Guide',
    excerpt: 'From flush to recessed, how different mortar joint profiles change the shadow play and aesthetic of your brickwork.',
    coverImage: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80',
    readTime: '8 min',
    category: 'Technical',
    author: 'Technical Team',
    featured: false,
    date: '2024-03-22',
    body: [
      'Mortar joints change the way a brick surface catches light. Flush joints make the wall read flatter and more contemporary, while recessed joints create stronger shadow lines and can make each brick feel more defined.',
      'For cladding and feature-wall projects, joint choice should be made before the final quantity and installation plan is approved. Joint width, grout colour, surface texture, and lighting direction all affect the final perception of depth.',
      'On exterior work, the joint profile also has a practical role. Weather exposure, cleaning expectations, and water shedding should be reviewed with the installer before choosing a deeply recessed or highly textured finish.'
    ],
    takeaways: [
      'Joint profile affects shadow, depth, and wall rhythm.',
      'Choose grout colour with the final lighting condition in mind.',
      'Exterior profiles must consider cleaning and water exposure.'
    ],
    relatedCategoryKeys: ['bricks', 'cladding-tiles', 'breeze-blocks'],
    relatedProductKeywords: ['mortar', 'joint', 'brick', 'cladding', 'breeze'],
  },
  {
    id: 'a3',
    type: 'news',
    title: 'Sustainable Firing Practices in 2024',
    excerpt: 'Brick Tile Shop announces carbon-offset initiatives and lower-emission kiln technologies across our core ranges.',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    readTime: '3 min',
    category: 'Sustainability',
    author: 'BTS Corporate',
    featured: false,
    date: '2024-03-18',
    body: [
      'Sustainable firing is becoming a deciding factor in material specification. Lower-emission kiln technology, improved batching controls, and measured offset programmes all reduce the environmental cost of clay-based products.',
      'The practical goal is not to remove fired clay from the building vocabulary. It is to make the supply chain more transparent and to help customers compare product performance, lifecycle durability, and embodied carbon more clearly.',
      'Brick Tile Shop will continue improving sourcing data, factory-linked product records, and project documentation so commercial buyers can make better specification decisions without sacrificing the tactile quality of clay.'
    ],
    takeaways: [
      'Sustainability should be measured across durability and lifecycle.',
      'Factory and product records make specification easier to defend.',
      'Lower-emission firing supports better commercial material decisions.'
    ],
    relatedCategoryKeys: ['cladding-tiles', 'bricks', 'paving', 'breeze-blocks'],
    relatedProductKeywords: ['sustainable', 'clay', 'kiln', 'brick', 'paver', 'tile'],
  },
  {
    id: 'a4',
    type: 'tips',
    title: 'Sealing Exterior Cladding: Best Practices',
    excerpt: 'Protect your investment. Optimal sealing schedules and product recommendations for coastal vs. inland projects.',
    coverImage: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
    readTime: '6 min',
    category: 'Maintenance',
    author: 'Support Team',
    featured: false,
    date: '2024-03-15',
    body: [
      'Exterior cladding needs a maintenance plan before installation starts. Coastal sites, high UV exposure, wind-driven rain, and garden irrigation can all change how frequently a surface should be checked or sealed.',
      'A good sealing decision starts with the product finish. Highly textured or porous faces may need different treatment from smoother tiles, and the wrong coating can flatten the natural material character customers selected in the first place.',
      'For most projects, the best approach is a test patch, a documented sealing schedule, and clear handover notes for cleaning. This protects the finish without turning a natural brick surface into a plastic-looking coating.'
    ],
    takeaways: [
      'Use test patches before committing to a sealer.',
      'Coastal and high-exposure sites need stricter maintenance checks.',
      'Protect the finish without hiding the natural material character.'
    ],
    relatedCategoryKeys: ['cladding-tiles'],
    relatedProductKeywords: ['seal', 'cladding', 'coastal', 'exterior', 'maintenance'],
  },
  {
    id: 'a5',
    type: 'blog',
    title: 'The Future of Brick: Digital Craftsmanship',
    excerpt: 'Exploring the intersection of robotic masonry and traditional bricklaying in next-generation architectural facades.',
    coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
    readTime: '7 min',
    category: 'Innovation',
    author: 'BTS Studio',
    featured: false,
    date: '2024-03-10',
    body: [
      'Digital craftsmanship is changing how brick projects are planned, not replacing the value of the brick itself. Robotic setting, parametric facade studies, and digital takeoffs allow designers to test more options before site work begins.',
      'The opportunity for Brick Tile Shop is to connect digital planning to real product truth. The product face, dimensions, material batch, lead time, and logistics path should remain grounded in inventory and supplier data.',
      'When digital tools are used well, they help customers see a realistic result sooner while giving contractors and installers better information before they commit to a quote or installation sequence.'
    ],
    takeaways: [
      'Digital tools should support real product specification.',
      'Parametric planning helps test facade and layout options faster.',
      'The best workflow connects design output to inventory and logistics.'
    ],
    relatedCategoryKeys: ['bricks', 'cladding-tiles'],
    relatedProductKeywords: ['brick', 'facade', 'digital', 'craftsmanship', 'cladding'],
  },
  {
    id: 'a6',
    type: 'guide',
    title: 'Choosing the Right Bond Pattern',
    excerpt: 'Stretcher, Flemish, English, and herringbone patterns, with practical advice for selecting the bond that fits the project.',
    coverImage: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
    readTime: '5 min',
    category: 'Design',
    author: 'BTS Studio',
    featured: false,
    date: '2024-03-05',
    body: [
      'Bond pattern selection controls the rhythm of a surface. Stretcher bonds usually feel calm and efficient, while herringbone, Flemish, and English bonds introduce stronger visual movement and a more crafted impression.',
      'The right pattern depends on the wall size, viewing distance, product proportion, and whether the material is structural, cladding, or paving. A small feature wall can carry a more expressive pattern than a large facade that needs long-distance calm.',
      'Before finalizing, check waste, cutting complexity, installer skill, and edge conditions. A pattern that looks simple in a render can become expensive if it creates too many cuts or awkward junctions.'
    ],
    takeaways: [
      'Match pattern complexity to scale and viewing distance.',
      'Consider waste and cuts before approving a bond.',
      'Use expressive bonds where the detail can actually be appreciated.'
    ],
    relatedCategoryKeys: ['bricks', 'paving', 'cladding-tiles'],
    relatedProductKeywords: ['bond', 'pattern', 'brick', 'paver', 'herringbone', 'stretcher'],
  },
  {
    id: 'a7',
    type: 'guide',
    title: 'Clay Paver Base Preparation Checklist',
    excerpt: 'A practical installation sequence for excavation, compaction, bedding sand, falls, edge restraint, and final jointing.',
    coverImage: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&q=80',
    readTime: '6 min',
    category: 'Paving',
    author: 'Technical Team',
    featured: false,
    date: '2024-04-01',
    body: [
      'Clay paver performance starts below the visible surface. Excavation depth, compaction quality, bedding sand, edge restraints, drainage falls, and final jointing all affect whether a paved area stays stable over time.',
      'Driveways and high-load zones need a different base strategy from garden paths or courtyards. The expected load, soil condition, water movement, and maintenance access should be checked before material quantities are locked.',
      'A clean paver installation sequence reduces callbacks. Confirm falls first, compact in controlled layers, keep bedding consistent, restrain the edges, and only finish jointing once the final alignment has been checked.'
    ],
    takeaways: [
      'A stable base matters more than the visible paver finish.',
      'Load, soil, and drainage determine the preparation sequence.',
      'Edge restraint and final jointing prevent long-term movement.'
    ],
    relatedCategoryKeys: ['paving'],
    relatedProductKeywords: ['paver', 'paving', 'base', 'bedding', 'driveway', 'courtyard'],
  },
  {
    id: 'a8',
    type: 'tips',
    title: 'Designing Breeze Block Privacy Screens',
    excerpt: 'How to balance privacy, airflow, light control, and structural rhythm when specifying architectural screen blocks.',
    coverImage: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',
    readTime: '4 min',
    category: 'Screens',
    author: 'BTS Studio',
    featured: false,
    date: '2024-04-03',
    body: [
      'Breeze block screens work best when privacy, airflow, and light are balanced together. A screen that blocks too much light can feel heavy, while one with too much openness may not solve the privacy problem.',
      'The pattern should respond to the site. Use tighter rhythms near direct neighbours or service areas, and more open rhythms where airflow and daylight are the main goals. Orientation and sun angle matter as much as the block profile.',
      'For residential and hospitality projects, the most successful screens look intentional from both sides. Plan the end conditions, structural support, and adjacent planting or lighting before approving the final layout.'
    ],
    takeaways: [
      'Balance privacy, light, and airflow from the start.',
      'Tune the screen rhythm to sun angle and neighbour exposure.',
      'Design both faces of the screen, not only the public side.'
    ],
    relatedCategoryKeys: ['breeze-blocks'],
    relatedProductKeywords: ['breeze', 'screen', 'privacy', 'airflow', 'terracotta'],
  },
];

export const COMMUNITY_CONTRACTORS: Contractor[] = [
  { id: 'c1', name: 'Cape Construct Co.', type: 'builder', region: 'Western Cape', city: 'Cape Town', specialties: ['Residential', 'Cladding', 'Renovations'], rating: 4.9, projectCount: 124, description: 'Premium residential and commercial building specialists with 15+ years of cladding expertise along the Western Cape coastline.', phone: '+27 21 123 4567', email: 'info@capeconstruct.co.za', website: 'capeconstruct.co.za', verified: true },
  { id: 'c2', name: 'Studio X Architects', type: 'architect', region: 'Western Cape', city: 'Cape Town', specialties: ['Commercial', 'Modernist', 'Adaptive Reuse'], rating: 5.0, projectCount: 67, description: 'Award-winning architecture practice focused on contemporary material expression and spatial innovation. Partners with BTS on high-end facade projects.', phone: '+27 21 987 6543', email: 'projects@studiox.co.za', website: 'studiox.co.za', verified: true },
  { id: 'c3', name: 'Joburg Interiors', type: 'interior_designer', region: 'Gauteng', city: 'Johannesburg', specialties: ['Hospitality', 'Residential', 'Feature Walls'], rating: 4.8, projectCount: 89, description: 'Transforming spaces through material excellence. We work closely with BTS products on every residential and hospitality project.', email: 'hello@joburginteriors.co.za', verified: true },
  { id: 'c4', name: 'Durban Build Masters', type: 'builder', region: 'KwaZulu-Natal', city: 'Durban', specialties: ['Coastal', 'Commercial', 'Large Scale'], rating: 4.7, projectCount: 201, description: 'Leading building contractor for the KZN coastal region. Specialised in salt-resistant cladding systems and large-scale commercial construction.', phone: '+27 31 456 7890', email: 'build@durbanmasters.co.za', verified: true },
  { id: 'c5', name: 'Verdant Landscape Design', type: 'landscape', region: 'Gauteng', city: 'Pretoria', specialties: ['Landscape', 'Paving', 'Garden Paths'], rating: 4.6, projectCount: 55, description: 'Creating outdoor spaces that flow seamlessly with architectural language using BTS paving and brick ranges.', phone: '+27 12 345 6789', email: 'design@verdant.co.za', website: 'verdantdesign.co.za', verified: false },
  { id: 'c6', name: 'Ndlovu Architecture', type: 'architect', region: 'KwaZulu-Natal', city: 'Pietermaritzburg', specialties: ['Heritage', 'Residential', 'Community'], rating: 4.9, projectCount: 43, description: 'Celebrating African architectural heritage through contemporary material storytelling and sensitive site response.', email: 'info@ndlovuarch.co.za', verified: true },
  { id: 'c7', name: 'The Design Bureau', type: 'interior_designer', region: 'Western Cape', city: 'Stellenbosch', specialties: ['Boutique', 'Wine Estates', 'Feature Walls'], rating: 4.8, projectCount: 38, description: 'Boutique interior practice creating spaces where materiality meets narrative. Known for signature brick feature walls.', website: 'designbureau.co.za', email: 'studio@designbureau.co.za', verified: true },
  { id: 'c8', name: 'EcoStone Builders', type: 'builder', region: 'Eastern Cape', city: 'Gqeberha', specialties: ['Sustainable', 'Residential', 'Green Build'], rating: 4.5, projectCount: 77, description: 'Sustainable building specialists committed to eco-conscious material selection and low-waste construction practices.', phone: '+27 41 234 5678', verified: false },
];

export function matchesCommunityProductContext(
  item: Pick<CommunityPost | KnowledgeArticle, 'relatedCategoryKeys' | 'relatedProductKeywords' | 'title'>,
  categoryKey: StorefrontCommunityCategoryKey,
  productTerms: string[],
) {
  if (item.relatedCategoryKeys.includes(categoryKey)) {
    return true;
  }

  const normalizedTerms = productTerms
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 3);

  if (normalizedTerms.length === 0) {
    return false;
  }

  const searchable = `${item.title} ${item.relatedProductKeywords.join(' ')}`.toLowerCase();
  return normalizedTerms.some((term) => searchable.includes(term));
}
