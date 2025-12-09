import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
    name: { type: String, required: true },
    distance: { type: Number, required: true }, // km
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    description: String,
    elevationMap: String, // URL/file path
    location: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

const Route = mongoose.model('Route', RouteSchema);
export default Route;
