/**
 * Seed script — populates the database with demo experts and available slots.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('./models/Expert');
const Booking = require('./models/Booking');

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];

const dates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i + 1);
  return fmt(d);
});

const expertsData = [
  {
    name: 'Dr. Priya Sharma',
    category: 'Technology',
    experience: 12,
    rating: 4.9,
    bio: 'Full-stack architect with expertise in scalable cloud systems, microservices, and AI integration.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    availableSlots: dates.slice(0, 5).map((date) => ({
      date,
      slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    })),
  },
  {
    name: 'James Mitchell',
    category: 'Finance',
    experience: 15,
    rating: 4.8,
    bio: 'CFA-certified investment strategist specializing in portfolio management and fintech innovation.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    availableSlots: dates.slice(1, 6).map((date) => ({
      date,
      slots: ['08:00', '09:00', '13:00', '14:00', '17:00'],
    })),
  },
  {
    name: 'Dr. Aisha Patel',
    category: 'Healthcare',
    experience: 10,
    rating: 4.7,
    bio: 'Board-certified physician turned health-tech advisor, helping startups navigate medical regulations.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
    availableSlots: dates.slice(0, 4).map((date) => ({
      date,
      slots: ['10:00', '11:00', '14:00', '15:00'],
    })),
  },
  {
    name: 'Carlos Rivera',
    category: 'Marketing',
    experience: 8,
    rating: 4.6,
    bio: 'Growth hacker and brand strategist with a track record of 10x-ing startups across LATAM and US markets.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    availableSlots: dates.slice(2, 7).map((date) => ({
      date,
      slots: ['09:00', '11:00', '13:00', '16:00'],
    })),
  },
  {
    name: 'Dr. Lindiwe Dlamini',
    category: 'Legal',
    experience: 18,
    rating: 4.9,
    bio: 'Corporate attorney specializing in IP law, cross-border M&A, and regulatory compliance.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lindiwe',
    availableSlots: dates.slice(0, 6).map((date) => ({
      date,
      slots: ['10:00', '11:00', '14:00', '15:00', '16:00'],
    })),
  },
  {
    name: 'Wei Zhang',
    category: 'Technology',
    experience: 9,
    rating: 4.5,
    bio: 'Machine learning engineer focused on NLP, computer vision, and responsible AI development.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wei',
    availableSlots: dates.slice(1, 5).map((date) => ({
      date,
      slots: ['08:00', '09:00', '10:00', '15:00', '16:00'],
    })),
  },
  {
    name: 'Sophie Leclerc',
    category: 'Design',
    experience: 7,
    rating: 4.8,
    bio: 'Award-winning UX/UI designer with expertise in design systems, accessibility, and product strategy.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    availableSlots: dates.slice(0, 7).map((date) => ({
      date,
      slots: ['09:00', '10:00', '11:00', '13:00', '14:00'],
    })),
  },
  {
    name: 'Arjun Nair',
    category: 'Finance',
    experience: 11,
    rating: 4.6,
    bio: 'Serial entrepreneur and startup finance coach — from pitch decks to Series B fundraising.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    availableSlots: dates.slice(2, 6).map((date) => ({
      date,
      slots: ['10:00', '12:00', '14:00', '16:00'],
    })),
  },
  {
    name: 'Elena Petrova',
    category: 'Marketing',
    experience: 6,
    rating: 4.4,
    bio: 'Digital marketing specialist in SEO, performance advertising, and content-led growth strategies.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    availableSlots: dates.slice(0, 5).map((date) => ({
      date,
      slots: ['09:00', '11:00', '14:00', '15:00'],
    })),
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Booking.deleteMany({});
    await Expert.deleteMany({});
    console.log('🗑  Cleared existing data');

    const experts = await Expert.insertMany(expertsData);
    console.log(`🌱 Seeded ${experts.length} experts`);

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
