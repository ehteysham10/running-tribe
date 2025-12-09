import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Route from '../models/Route.js';
import User from '../models/User.js';

dotenv.config();

// 1. Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI); // Mongoose 7+ requires no options
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// 2. Main seeding function
const seedRoutes = async () => {
    try {
        await connectDB();

        // Delete existing routes (optional)
        await Route.deleteMany();
        console.log('Existing routes cleared');

        // Get an admin user for createdBy field
        const adminUser = await User.findOne({ isAdmin: true });
        if (!adminUser) {
            console.log('No admin user found. Please create an admin first.');
            process.exit();
        }

        // 25 sample routes
        const routes = [
            { name: 'Morning Park Loop', distance: 5, difficulty: 'easy', description: 'A gentle 5km loop around the park.', elevationMap: '', location: 'Central Park', createdBy: adminUser._id },
            { name: 'City Trail Run', distance: 8, difficulty: 'medium', description: 'City streets with a few hills.', elevationMap: '', location: 'Downtown', createdBy: adminUser._id },
            { name: 'River Side Sprint', distance: 3, difficulty: 'easy', description: 'Quick run along the river.', elevationMap: '', location: 'Riverbank', createdBy: adminUser._id },
            { name: 'Forest Adventure', distance: 10, difficulty: 'hard', description: 'Trail run through the forest.', elevationMap: '', location: 'Greenwood Forest', createdBy: adminUser._id },
            { name: 'Beach Run', distance: 6, difficulty: 'easy', description: 'Relaxing run along the beach.', elevationMap: '', location: 'Sunny Beach', createdBy: adminUser._id },
            { name: 'Hills Challenge', distance: 12, difficulty: 'hard', description: 'Steep hill climbs.', elevationMap: '', location: 'Hilltop', createdBy: adminUser._id },
            { name: 'Lake Loop', distance: 7, difficulty: 'medium', description: 'Loop around the lake.', elevationMap: '', location: 'Lakeview', createdBy: adminUser._id },
            { name: 'Sunset Trail', distance: 5, difficulty: 'easy', description: 'Beautiful sunset views.', elevationMap: '', location: 'Sunset Trail', createdBy: adminUser._id },
            { name: 'Morning Jog', distance: 4, difficulty: 'easy', description: 'Perfect short morning jog.', elevationMap: '', location: 'City Park', createdBy: adminUser._id },
            { name: 'Hill Sprint', distance: 6, difficulty: 'medium', description: 'Sprint up the hills.', elevationMap: '', location: 'North Hills', createdBy: adminUser._id },
            { name: 'River Cross', distance: 9, difficulty: 'medium', description: 'Run across multiple bridges.', elevationMap: '', location: 'River City', createdBy: adminUser._id },
            { name: 'Forest Trail', distance: 11, difficulty: 'hard', description: 'Long trail in the forest.', elevationMap: '', location: 'Pinewood', createdBy: adminUser._id },
            { name: 'Downtown Dash', distance: 5, difficulty: 'easy', description: 'Quick city dash.', elevationMap: '', location: 'Downtown', createdBy: adminUser._id },
            { name: 'Mountain Loop', distance: 15, difficulty: 'hard', description: 'Challenging mountain route.', elevationMap: '', location: 'Blue Mountains', createdBy: adminUser._id },
            { name: 'Park Fun Run', distance: 3, difficulty: 'easy', description: 'Short fun run in park.', elevationMap: '', location: 'Central Park', createdBy: adminUser._id },
            { name: 'Trail Challenge', distance: 12, difficulty: 'hard', description: 'Difficult trail with hills.', elevationMap: '', location: 'Trailwoods', createdBy: adminUser._id },
            { name: 'Evening Jog', distance: 5, difficulty: 'easy', description: 'Relaxed evening jog.', elevationMap: '', location: 'City Park', createdBy: adminUser._id },
            { name: 'Riverside Loop', distance: 8, difficulty: 'medium', description: 'Nice riverside path.', elevationMap: '', location: 'Riverbank', createdBy: adminUser._id },
            { name: 'Sunrise Sprint', distance: 6, difficulty: 'medium', description: 'Catch the sunrise while running.', elevationMap: '', location: 'Sunrise Hill', createdBy: adminUser._id },
            { name: 'Hilltop Run', distance: 10, difficulty: 'hard', description: 'Run to the top of the hill.', elevationMap: '', location: 'North Hills', createdBy: adminUser._id },
            { name: 'City Marathon Prep', distance: 15, difficulty: 'hard', description: 'Prepare for city marathon.', elevationMap: '', location: 'Downtown', createdBy: adminUser._id },
            { name: 'Lakeside Jog', distance: 4, difficulty: 'easy', description: 'Short lakeside jog.', elevationMap: '', location: 'Lakeview', createdBy: adminUser._id },
            { name: 'Forest Sprint', distance: 7, difficulty: 'medium', description: 'Medium forest trail.', elevationMap: '', location: 'Pinewood', createdBy: adminUser._id },
            { name: 'Beach Challenge', distance: 9, difficulty: 'hard', description: 'Run along the beach with sand hills.', elevationMap: '', location: 'Sunny Beach', createdBy: adminUser._id },
            { name: 'City Loop', distance: 6, difficulty: 'medium', description: 'Loop through city streets.', elevationMap: '', location: 'Downtown', createdBy: adminUser._id },
        ];

        await Route.insertMany(routes);
        console.log('25 routes seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding routes:', err);
        process.exit(1);
    }
};

// Run seeder
seedRoutes();
