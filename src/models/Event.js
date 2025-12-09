
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Event title is required"],
        minlength: [3, "Title must be at least 3 characters"],
        maxlength: [100, "Title must be less than 100 characters"]
    },
    description: {
        type: String,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    event_date: {
        type: Date,
        required: [true, "Event date is required"],
        validate: {
            validator: (value) => value >= new Date(),
            message: "Event date cannot be in the past"
        }
    },
    start_time: {
        type: String,
        validate: {
            validator: function (v) {
                return /^([0][1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i.test(v);
            },
            message: props => `${props.value} is not a valid time format! Use hh:mm AM/PM`
        }
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        minlength: [3, "Location must be at least 3 characters"]
    },
    distance_km: {
        type: Number,
        min: [0, "Distance cannot be negative"],
        max: [200, "Distance cannot exceed 200km"]
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: false
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    banner: String,
    participants: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    likes: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    max_participants: {
        type: Number,
        min: [1, "Max participants must be at least 1"],
        default: null
    },
    status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed"],
        default: "upcoming"
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Event", eventSchema);
