import mongoose from 'mongoose';

const RunSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    distance: Number,
    time: Number,
    pace: Number,
    elevation: Number,
    status: { type: String, enum: ['in-progress','completed'], default: 'in-progress' },
    startTime: Date,
    endTime: Date,
    createdAt: { type: Date, default: Date.now },
});


const Run = mongoose.model('Run', RunSchema);
export default Run;
