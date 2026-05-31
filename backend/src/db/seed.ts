/**
 * Farmify Database Seeder
 *
 * Seeds the database with:
 * - Users (admin, farmers, buyers) with hashed passwords
 * - Products for each farmer
 * - Jobs posted by farmers
 * - Inventory items for each farmer
 * - Sample orders from buyers
 * - Sample cart items
 *
 * Usage: npm run db:seed
 * Requires: database initialized (npm run db:init)
 */

import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

// ── Seed Data ──────────────────────────────────────────────────────────────

const SALT_ROUNDS = 10;

const users = [
  {
    name: 'Admin Juan',
    email: 'admin@farmify.com',
    password: 'admin123',
    role: 'admin',
    phone: '+63 912 345 6789',
    address: 'Quezon City, Philippines',
  },
  {
    name: 'Mang Pedro Santos',
    email: 'pedro@farmify.com',
    password: 'farmer123',
    role: 'farmer',
    phone: '+63 923 456 7890',
    address: 'Brgy. San Miguel, Nueva Ecija',
  },
  {
    name: 'Maria Reyes',
    email: 'maria@farmify.com',
    password: 'farmer123',
    role: 'farmer',
    phone: '+63 934 567 8901',
    address: 'Brgy. Malagos, Davao City',
  },
  {
    name: 'Ka Juan Tamad',
    email: 'juan@farmify.com',
    password: 'farmer123',
    role: 'farmer',
    phone: '+63 945 678 9012',
    address: 'Brgy. Poblacion, Pangasinan',
  },
  {
    name: 'Carlos Mendoza',
    email: 'carlos@farmify.com',
    password: 'buyer123',
    role: 'buyer',
    phone: '+63 956 789 0123',
    address: 'Makati City, Philippines',
  },
  {
    name: 'Ana Dela Cruz',
    email: 'ana@farmify.com',
    password: 'buyer123',
    role: 'buyer',
    phone: '+63 967 890 1234',
    address: 'Cebu City, Philippines',
  },
];

const products: Array<{
  farmerIndex: number;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  is_organic: boolean;
}> = [
  // Farmer 0 (Pedro) - Rice & Vegetable Farmer
  {
    farmerIndex: 0,
    name: 'Organic Brown Rice',
    description: 'Premium organic brown rice harvested from our family farm. Naturally grown without pesticides. High in fiber and nutrients.',
    category: 'Grains',
    price: 85.00,
    unit: 'kg',
    quantity: 500,
    is_organic: true,
  },
  {
    farmerIndex: 0,
    name: 'Fresh Baguio Beans',
    description: 'Crisp and tender Baguio beans picked fresh daily. Perfect for stews and stir-fries.',
    category: 'Vegetables',
    price: 60.00,
    unit: 'kg',
    quantity: 100,
    is_organic: false,
  },
  {
    farmerIndex: 0,
    name: 'Native Pechay',
    description: 'Fresh native pechay (pak choi) grown using traditional farming methods. Great for soups and sautés.',
    category: 'Vegetables',
    price: 35.00,
    unit: 'bundle',
    quantity: 200,
    is_organic: true,
  },
  // Farmer 1 (Maria) - Dragon Fruit & Fruit Farmer
  {
    farmerIndex: 1,
    name: 'Fresh Dragon Fruit (Red)',
    description: 'Sweet and juicy red dragon fruit directly from our farm in Davao. Rich in antioxidants.',
    category: 'Fruits',
    price: 120.00,
    unit: 'kg',
    quantity: 300,
    is_organic: true,
  },
  {
    farmerIndex: 1,
    name: 'Fresh Dragon Fruit (White)',
    description: 'Classic white-fleshed dragon fruit with a mild sweet flavor. Perfect for desserts and smoothies.',
    category: 'Fruits',
    price: 100.00,
    unit: 'kg',
    quantity: 250,
    is_organic: true,
  },
  {
    farmerIndex: 1,
    name: 'Davao Pomelo',
    description: 'Large, sweet pomelo from Davao. Known for its thick rind and deliciously sweet segments.',
    category: 'Fruits',
    price: 150.00,
    unit: 'piece',
    quantity: 100,
    is_organic: false,
  },
  // Farmer 2 (Juan) - Mixed Farm
  {
    farmerIndex: 2,
    name: 'Free-Range Chicken Eggs',
    description: 'Farm-fresh eggs from free-range chickens. Rich orange yolks, perfect for your daily breakfast.',
    category: 'Poultry',
    price: 12.00,
    unit: 'piece',
    quantity: 1000,
    is_organic: true,
  },
  {
    farmerIndex: 2,
    name: 'Fresh Carabao Milk',
    description: 'Pure and fresh carabao (water buffalo) milk. High in protein and calcium. Perfect for making kesong puti.',
    category: 'Dairy',
    price: 80.00,
    unit: 'liter',
    quantity: 50,
    is_organic: false,
  },
  {
    farmerIndex: 2,
    name: 'Organic Honey (Raw)',
    description: 'Pure raw honey harvested from our own bee farms. Unprocessed and full of natural enzymes and antioxidants.',
    category: 'Others',
    price: 250.00,
    unit: 'bottle',
    quantity: 80,
    is_organic: true,
  },
];

const jobs: Array<{
  farmerIndex: number;
  title: string;
  description: string;
  category: string;
  location: string;
  salary_min: number;
  salary_max: number;
  salary_type: string;
  employment_type: string;
  requirements: string;
}> = [
  {
    farmerIndex: 0,
    title: 'Rice Field Worker',
    description: 'We are looking for experienced rice field workers for the upcoming planting season. Tasks include seedling preparation, planting, irrigation management, and basic farm maintenance.',
    category: 'Farm Labor',
    location: 'Nueva Ecija',
    salary_min: 400,
    salary_max: 600,
    salary_type: 'daily',
    employment_type: 'seasonal',
    requirements: '• At least 1 year experience in rice farming\n• Physically fit\n• Willing to work long hours under the sun\n• Can start immediately',
  },
  {
    farmerIndex: 0,
    title: 'Farm Equipment Operator',
    description: 'Need a skilled operator for farm tractors and hand tractors. Must know basic maintenance and troubleshooting.',
    category: 'Equipment',
    location: 'Nueva Ecija',
    salary_min: 18000,
    salary_max: 25000,
    salary_type: 'fixed',
    employment_type: 'full-time',
    requirements: '• Valid driver\'s license\n• Experience with farm machinery\n• Basic mechanical knowledge\n• At least high school graduate',
  },
  {
    farmerIndex: 1,
    title: 'Dragon Fruit Harvesters',
    description: 'Looking for harvesters for our dragon fruit farm. Work includes early morning harvesting, sorting, and packing.',
    category: 'Farm Labor',
    location: 'Davao City',
    salary_min: 450,
    salary_max: 550,
    salary_type: 'daily',
    employment_type: 'seasonal',
    requirements: '• Can work early mornings (4 AM start)\n• Physically fit\n• Attention to quality\n• No experience needed, training provided',
  },
  {
    farmerIndex: 1,
    title: 'Farm Supervisor',
    description: 'We need a farm supervisor to oversee daily operations of our dragon fruit plantation. Will manage 5-10 workers.',
    category: 'Management',
    location: 'Davao City',
    salary_min: 22000,
    salary_max: 30000,
    salary_type: 'fixed',
    employment_type: 'full-time',
    requirements: '• With agricultural degree or equivalent experience\n• At least 2 years supervisory experience\n• Good leadership and communication skills\n• Willing to relocate to Davao',
  },
  {
    farmerIndex: 2,
    title: 'Poultry Farm Attendant',
    description: 'Hiring poultry attendants for our free-range chicken farm. Duties include feeding, egg collection, cleaning, and health monitoring.',
    category: 'Farm Labor',
    location: 'Pangasinan',
    salary_min: 350,
    salary_max: 450,
    salary_type: 'daily',
    employment_type: 'full-time',
    requirements: '• No experience required\n• Must be reliable and honest\n• Can work weekends\n• Willing to be trained',
  },
  {
    farmerIndex: 2,
    title: 'Organic Fertilizer Specialist',
    description: 'Looking for a specialist to help us produce organic fertilizer from farm waste. Knowledge of composting and vermiculture required.',
    category: 'Technical',
    location: 'Pangasinan',
    salary_min: 15000,
    salary_max: 20000,
    salary_type: 'fixed',
    employment_type: 'contract',
    requirements: '• Degree in Agriculture or related field\n• Knowledge of organic farming practices\n• Experience with composting systems\n• Can work independently',
  },
];

const inventoryItems: Array<{
  farmerIndex: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  unit_cost: number;
  supplier: string;
  notes: string;
}> = [
  // Farmer 0 (Pedro) - Rice Farm
  {
    farmerIndex: 0,
    name: 'Rice Seeds (NSIC Rc222)',
    category: 'Seeds',
    quantity: 50,
    unit: 'kg',
    min_quantity: 20,
    unit_cost: 45,
    supplier: 'DA-PhilRice',
    notes: 'High-yield variety, 120 days maturity',
  },
  {
    farmerIndex: 0,
    name: 'Urea Fertilizer (46-0-0)',
    category: 'Fertilizer',
    quantity: 200,
    unit: 'kg',
    min_quantity: 50,
    unit_cost: 55,
    supplier: 'FertiPhos Corp',
    notes: 'For basal application',
  },
  {
    farmerIndex: 0,
    name: 'Organic Pesticide (Neem Oil)',
    category: 'Pesticides',
    quantity: 15,
    unit: 'liters',
    min_quantity: 5,
    unit_cost: 180,
    supplier: 'Green Harvest Supply',
    notes: 'Organic certified, safe for vegetables',
  },
  {
    farmerIndex: 0,
    name: 'Hand Tractor Spare Parts Kit',
    category: 'Equipment',
    quantity: 3,
    unit: 'sets',
    min_quantity: 1,
    unit_cost: 2500,
    supplier: 'FarmMach Trading',
    notes: 'Includes belts, bearings, spark plugs',
  },
  // Farmer 1 (Maria) - Dragon Fruit Farm
  {
    farmerIndex: 1,
    name: 'Dragon Fruit Cuttings',
    category: 'Planting Materials',
    quantity: 500,
    unit: 'pieces',
    min_quantity: 100,
    unit_cost: 25,
    supplier: 'Davao Agri Supply',
    notes: 'Red variety cuttings, 1-year old',
  },
  {
    farmerIndex: 1,
    name: 'Organic Compost',
    category: 'Fertilizer',
    quantity: 1000,
    unit: 'kg',
    min_quantity: 200,
    unit_cost: 12,
    supplier: 'Self-produced',
    notes: 'From farm waste and chicken manure',
  },
  {
    farmerIndex: 1,
    name: 'Drip Irrigation System Parts',
    category: 'Equipment',
    quantity: 10,
    unit: 'sets',
    min_quantity: 3,
    unit_cost: 1500,
    supplier: 'Agri-Tech Solutions',
    notes: 'Includes tubing, emitters, connectors',
  },
  {
    farmerIndex: 1,
    name: 'Packing Boxes (Fruit Grade)',
    category: 'Packaging',
    quantity: 200,
    unit: 'pieces',
    min_quantity: 50,
    unit_cost: 35,
    supplier: 'PackPro Inc.',
    notes: 'Standard fruit shipping boxes, 5kg capacity',
  },
  // Farmer 2 (Juan) - Mixed Farm
  {
    farmerIndex: 2,
    name: 'Layer Chicken Feed (Starter)',
    category: 'Animal Feed',
    quantity: 300,
    unit: 'kg',
    min_quantity: 100,
    unit_cost: 32,
    supplier: 'PoultryFeeds Corp',
    notes: 'For chicks 0-8 weeks',
  },
  {
    farmerIndex: 2,
    name: 'Layer Chicken Feed (Layer)',
    category: 'Animal Feed',
    quantity: 500,
    unit: 'kg',
    min_quantity: 150,
    unit_cost: 28,
    supplier: 'PoultryFeeds Corp',
    notes: 'For mature layers, high calcium',
  },
  {
    farmerIndex: 2,
    name: 'Egg Trays (30-pc)',
    category: 'Packaging',
    quantity: 50,
    unit: 'pieces',
    min_quantity: 20,
    unit_cost: 8,
    supplier: 'Local Market',
    notes: 'Recyclable paper egg trays',
  },
  {
    farmerIndex: 2,
    name: 'Glass Honey Jars (250ml)',
    category: 'Packaging',
    quantity: 120,
    unit: 'pieces',
    min_quantity: 30,
    unit_cost: 15,
    supplier: 'GlassPak Manufacturing',
    notes: 'With airtight lids, food-grade',
  },
];

// ── Seeding Functions ───────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('\n🌱 Farmify Database Seeder');
    console.log('══════════════════════════\n');

    await client.query('BEGIN');

    // ── Clear existing data ──────────────────────────────────────────
    console.log('🗑️  Clearing existing data...');
    await client.query('DELETE FROM cart_items');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM inventory_transactions');
    await client.query('DELETE FROM inventory_items');
    await client.query('DELETE FROM job_applications');
    await client.query('DELETE FROM jobs');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM users');
    // Reset sequences
    await client.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE products_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE orders_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE order_items_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE cart_items_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE job_applications_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE inventory_items_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE inventory_transactions_id_seq RESTART WITH 1");

    // ── Seed Users ──────────────────────────────────────────────────
    console.log('👤 Seeding users...');
    const userIds: number[] = [];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      const result = await client.query(
        `INSERT INTO users (name, email, password, role, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [user.name, user.email, hashedPassword, user.role, user.phone, user.address]
      );
      userIds.push(result.rows[0].id);
      console.log(`  ✅ ${user.role.padEnd(8)} ${user.email.padEnd(30)} ${user.name}`);
    }

    // Map named roles to indices
    const adminId = userIds[0];
    const farmerIds = [userIds[1], userIds[2], userIds[3]];
    const buyerIds = [userIds[4], userIds[5]];

    // ── Seed Products ───────────────────────────────────────────────
    console.log('\n📦 Seeding products...');
    const productIds: number[] = [];

    for (const product of products) {
      const farmerId = farmerIds[product.farmerIndex];
      const result = await client.query(
        `INSERT INTO products (farmer_id, name, description, category, price, unit, quantity, is_organic)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [farmerId, product.name, product.description, product.category,
         product.price, product.unit, product.quantity, product.is_organic]
      );
      productIds.push(result.rows[0].id);
      const organicLabel = product.is_organic ? '🌱 Organic' : '         ';
      console.log(`  ✅ ${organicLabel} ${product.name.padEnd(35)} ₱${product.price.toFixed(2)}/${product.unit}`);
    }

    // ── Seed Jobs ───────────────────────────────────────────────────
    console.log('\n💼 Seeding jobs...');
    const jobIds: number[] = [];

    for (const job of jobs) {
      const farmerId = farmerIds[job.farmerIndex];
      const result = await client.query(
        `INSERT INTO jobs (farmer_id, title, description, category, location,
                           salary_min, salary_max, salary_type, employment_type, requirements)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [farmerId, job.title, job.description, job.category, job.location,
         job.salary_min, job.salary_max, job.salary_type, job.employment_type, job.requirements]
      );
      jobIds.push(result.rows[0].id);
      const salaryStr = job.salary_type === 'daily' ? `₱${job.salary_min}-${job.salary_max}/day`
        : job.salary_type === 'fixed' ? `₱${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()}/mo`
        : 'Negotiable';
      console.log(`  ✅ ${job.title.padEnd(35)} ${salaryStr.padEnd(25)} ${job.employment_type}`);
    }

    // ── Seed Inventory Items ────────────────────────────────────────
    console.log('\n📋 Seeding inventory items...');
    const inventoryIds: number[] = [];

    for (const item of inventoryItems) {
      const farmerId = farmerIds[item.farmerIndex];
      const result = await client.query(
        `INSERT INTO inventory_items (farmer_id, name, category, quantity, unit,
                                      min_quantity, unit_cost, supplier, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [farmerId, item.name, item.category, item.quantity, item.unit,
         item.min_quantity, item.unit_cost, item.supplier, item.notes]
      );
      inventoryIds.push(result.rows[0].id);
      const stockStatus = item.quantity <= item.min_quantity ? '⚠️ LOW STOCK' : '✅ In stock';
      console.log(`  ${stockStatus} ${item.name.padEnd(40)} ${item.quantity} ${item.unit}`);
    }

    // ── Seed Orders ─────────────────────────────────────────────────
    console.log('\n🛒 Seeding sample orders...');

    // Order 1: Carlos buys dragon fruit from Maria
    const order1Result = await client.query(
      `INSERT INTO orders (buyer_id, status, total_amount, shipping_address, payment_method, notes)
       VALUES ($1, 'delivered', $2, $3, $4, $5)
       RETURNING id`,
      [buyerIds[0], 440,
       '123 Legaspi St., Makati City', 'GCash',
       'Please pack carefully, these are for a restaurant']
    );
    const order1Id = order1Result.rows[0].id;
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [order1Id, productIds[3], 2, 120, 240]  // Red dragon fruit x2
    );
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [order1Id, productIds[4], 2, 100, 200]  // White dragon fruit x2
    );

    // Order 2: Ana buys from Pedro
    const order2Result = await client.query(
      `INSERT INTO orders (buyer_id, status, total_amount, shipping_address, payment_method)
       VALUES ($1, 'shipped', $2, $3, $4)
       RETURNING id`,
      [buyerIds[1], 275,
       '456 Osmeña Blvd., Cebu City', 'Bank Transfer']
    );
    const order2Id = order2Result.rows[0].id;
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [order2Id, productIds[0], 2, 85, 170]   // Organic brown rice x2
    );
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [order2Id, productIds[2], 3, 35, 105]   // Pechay x3
    );

    // Order 3: Carlos buys eggs from Juan (pending)
    const order3Result = await client.query(
      `INSERT INTO orders (buyer_id, status, total_amount, shipping_address, payment_method, notes)
       VALUES ($1, 'pending', $2, $3, $4, $5)
       RETURNING id`,
      [buyerIds[0], 240,
       '123 Legaspi St., Makati City', 'COD',
       'Need these for Saturday brunch service']
    );
    const order3Id = order3Result.rows[0].id;
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [order3Id, productIds[6], 20, 12, 240]  // Eggs x20
    );

    // ── Seed Cart Items ─────────────────────────────────────────────
    console.log('🛍️  Seeding sample cart items...');
    await client.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)`,
      [buyerIds[1], productIds[7], 2]  // Ana has honey in cart
    );
    await client.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)`,
      [buyerIds[1], productIds[6], 6]  // Ana has eggs in cart
    );

    await client.query('COMMIT');

    // ── Summary ─────────────────────────────────────────────────────
    console.log('\n══════════════════════════');
    console.log('📊 Seed Summary');
    console.log('══════════════════════════');
    console.log(`  👤 Users:              ${users.length}`);
    console.log(`     ├─ Admin:            1 (admin@farmify.com)`);
    console.log(`     ├─ Farmers:          3 (pedro@, maria@, juan@)`);
    console.log(`     └─ Buyers:           2 (carlos@, ana@)`);
    console.log(`  📦 Products:           ${products.length}`);
    console.log(`  💼 Jobs:               ${jobs.length}`);
    console.log(`  📋 Inventory Items:    ${inventoryItems.length}`);
    console.log(`  🛒 Orders:             3 (1 delivered, 1 shipped, 1 pending)`);
    console.log(`  🛍️  Cart Items:         2`);

    console.log('\n🔑 Login Credentials');
    console.log('──────────────────────');
    console.log(`  Admin:   admin@farmify.com / admin123`);
    console.log(`  Farmer:  pedro@farmify.com / farmer123`);
    console.log(`  Farmer:  maria@farmify.com / farmer123`);
    console.log(`  Farmer:  juan@farmify.com  / farmer123`);
    console.log(`  Buyer:   carlos@farmify.com / buyer123`);
    console.log(`  Buyer:   ana@farmify.com / buyer123`);

    console.log('\n🎉 Database seeding complete!\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
