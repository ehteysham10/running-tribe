
// import asyncHandler from "express-async-handler";
// import Event from "../models/Event.js";
// import User from "../models/User.js";
// import Route from "../models/Route.js";
// import { sendPushNotification } from "../services/notificationService.js";

// // ---------------------------------------------------
// // HELPER → Fetch event or throw
// // ---------------------------------------------------
// const findEventOrFail = async (id) => {
//   const event = await Event.findById(id);
//   if (!event) throw { status: 404, message: "Event not found" };
//   return event;
// };

// // ---------------------------------------------------
// // HELPER → Validate optional route
// // ---------------------------------------------------
// const validateRoute = async (routeId) => {
//   if (!routeId) return null;
//   const route = await Route.findById(routeId);
//   if (!route || !route.createdBy) throw { status: 400, message: "Invalid route" };
//   return route;
// };

// // ---------------------------------------------------
// // HELPER → Send notifications
// // ---------------------------------------------------
// const notifyUsers = (users, title, message) => {
//   users.forEach(u => u.fcmToken && sendPushNotification(u.fcmToken, title, message));
// };


// // ---------------------------------------------------
// // CREATE EVENT → Premium Only
// // ---------------------------------------------------
// export const createEvent = asyncHandler(async (req, res) => {
//   if (req.user.membership !== "premium") {
//     return res.status(403).json({ message: "Only premium users can create events." });
//   }

//   const { title, description, event_date, start_time, location, distance_km, max_participants, route } = req.body;

//   const missing = ["title", "event_date", "location"].filter(k => !req.body[k]);
//   if (missing.length) return res.status(400).json({ message: `Missing required field(s): ${missing.join(", ")}` });

//   const routeDoc = await validateRoute(route);

//   const event = await Event.create({
//     title,
//     description,
//     event_date,
//     start_time,
//     location,
//     distance_km,
//     max_participants: max_participants || null,
//     created_by: req.user._id,
//     banner: req.file ? `/uploads/${req.file.filename}` : undefined,
//     route: routeDoc?._id
//   });

//   const users = await User.find({ fcmToken: { $ne: null } }).lean();
//   notifyUsers(users, "New Event Published", `Check out the new event: ${event.title} on ${event.event_date}`);

//   res.status(201).json({ event });
// });

// // ---------------------------------------------------
// // GET EVENTS (Public)
// // ---------------------------------------------------
// export const getEvents = asyncHandler(async (req, res) => {
//   const events = await Event.find()
//     .populate("created_by", "name email avatar")
//     .populate("route", "name distance difficulty description location elevationMap")
//     .sort({ event_date: 1 })
//     .lean();

//   events.forEach(event => {
//     event.likesCount = event.likes ? event.likes.length : 0;
//   });

//   res.json({ events });
// });

// // ---------------------------------------------------
// // GET SINGLE EVENT (Public)
// // ---------------------------------------------------
// export const getEvent = asyncHandler(async (req, res) => {
//   const event = await Event.findById(req.params.id)
//     .populate("created_by", "name email avatar")
//     .populate("participants", "name email avatar")
//     .populate("route", "name distance difficulty description location elevationMap")
//     .lean();

//   if (!event) return res.status(404).json({ message: "Event not found" });

//   event.likesCount = event.likes ? event.likes.length : 0;

//   res.json({ event });
// });

// // ---------------------------------------------------
// // LIKE EVENT → Any user
// // ---------------------------------------------------
// export const likeEvent = asyncHandler(async (req, res) => {
//     const event = await Event.findByIdAndUpdate(
//         req.params.id,
//         { $addToSet: { likes: req.user._id } }, // add user if not already liked
//         { new: true }
//     ).populate("created_by", "name email avatar")
//      .populate("route", "name distance difficulty");

//     if (!event) return res.status(404).json({ message: "Event not found" });

//     res.json({ message: "Event liked", event });
// });

// // ---------------------------------------------------
// // UNLIKE EVENT → Any user
// // ---------------------------------------------------
// export const unlikeEvent = asyncHandler(async (req, res) => {
//     const event = await Event.findByIdAndUpdate(
//         req.params.id,
//         { $pull: { likes: req.user._id } }, // remove user from likes
//         { new: true }
//     ).populate("created_by", "name email avatar")
//      .populate("route", "name distance difficulty");

//     if (!event) return res.status(404).json({ message: "Event not found" });

//     res.json({ message: "Event unliked", event });
// });



// // GET Liked Events → fetch all events liked by the user
// // ---------------------------------------------------
// export const getLikedEvents = asyncHandler(async (req, res) => {
//     const events = await Event.find({ likes: req.user._id })
//         .populate("created_by", "name email avatar")
//         .populate("route", "name distance difficulty")
//         .sort({ event_date: 1 });

//     res.json({ events });
// });

// // ---------------------------------------------------
// // UPDATE EVENT → Creator (Premium Only)
// // ---------------------------------------------------
// export const updateEvent = asyncHandler(async (req, res) => {
//   const event = await findEventOrFail(req.params.id);

//   if (String(event.created_by) !== String(req.user._id)) 
//     return res.status(403).json({ message: "Only creator can update this event." });

//   const updates = { ...req.body };
//   if (req.file) updates.banner = `/uploads/${req.file.filename}`;
//   if (updates.route) updates.route = (await validateRoute(updates.route))._id;

//   if (updates.max_participants && updates.max_participants < event.participants.length)
//     return res.status(400).json({
//       message: `Cannot set max participants below current joined users (${event.participants.length})`
//     });

//   const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

//   const participants = await User.find({ _id: { $in: updatedEvent.participants }, fcmToken: { $ne: null } }).lean();
//   notifyUsers(participants, "Event Updated", `Event "${updatedEvent.title}" has been updated`);

//   res.json({ event: updatedEvent });
// });

// // ---------------------------------------------------
// // DELETE EVENT → Creator (Premium Only)
// // ---------------------------------------------------
// export const deleteEvent = asyncHandler(async (req, res) => {
//   const event = await findEventOrFail(req.params.id);

//   if (String(event.created_by) !== String(req.user._id)) 
//     return res.status(403).json({ message: "Only creator can delete this event." });

//   const participants = await User.find({ _id: { $in: event.participants }, fcmToken: { $ne: null } }).lean();
//   notifyUsers(participants, "Event Cancelled", `Event "${event.title}" has been cancelled`);

//   await event.deleteOne();
//   res.json({ message: "Event deleted" });
// });

// // ---------------------------------------------------
// // JOIN EVENT → Premium Only
// // ---------------------------------------------------
// export const joinEvent = asyncHandler(async (req, res) => {
//   if (req.user.membership !== "premium") {
//     return res.status(403).json({ message: "Upgrade to premium to join events." });
//   }

//   const event = await Event.findById(req.params.id).populate("created_by", "name fcmToken");
//   if (!event) return res.status(404).json({ message: "Event not found" });
//   if (String(event.created_by._id) === String(req.user._id)) 
//     return res.status(400).json({ message: "Creator can't join their own event" });
//   if (event.participants.includes(req.user._id)) 
//     return res.status(400).json({ message: "You already joined this event" });
//   if (event.max_participants && event.participants.length >= event.max_participants) 
//     return res.status(400).json({ message: "Event is full" });

//   event.participants.push(req.user._id);
//   await event.save();

//   notifyUsers([req.user], "Event Registration Confirmed", `You joined the event: ${event.title} on ${event.event_date}`);
//   if (event.created_by.fcmToken) 
//     sendPushNotification(event.created_by.fcmToken, "New Participant Joined", `${req.user.name} joined your event: ${event.title}`);

//   res.json({ event });
// });

// // ---------------------------------------------------
// // REMOVE PARTICIPANT → Creator Only
// // ---------------------------------------------------





// export const removeParticipant = asyncHandler(async (req, res) => {
//   const event = await findEventOrFail(req.params.id);

//   if (String(event.created_by) !== String(req.user._id)) 
//     return res.status(403).json({ message: "Only creator can remove participants" });

//   // Find the removed participant before filtering
//   const removedUserId = req.params.userId;
//   const removedUser = await User.findById(removedUserId);

//   if (!removedUser) {
//     return res.status(404).json({ message: "Participant not found" });
//   }

//   // Remove participant
//   event.participants = event.participants.filter(id => String(id) !== String(removedUserId));
//   await event.save();

//   // -------------------------------
//   // 🔔 Send Push Notification to removed user
//   // -------------------------------
//   if (removedUser.fcmToken) {
//     try {
//       await sendPushNotification(
//         removedUser.fcmToken,
//         "Removed from Event",
//         `You were removed from the event: "${event.title}"`,
//         {
//           type: "event_removed",
//           eventId: String(event._id),
//           removedBy: String(req.user._id),
//         }
//       );
//     } catch (err) {
//       console.error("❌ Failed to send removal notification:", err);
//     }
//   }

//   res.json({ event });
// });


// // ---------------------------------------------------
// // GET PARTICIPANTS (Public)
// // ---------------------------------------------------
// export const getParticipants = asyncHandler(async (req, res) => {
//   const event = await Event.findById(req.params.id).populate("participants", "name email avatar");
//   if (!event) return res.status(404).json({ message: "Event not found" });
//   res.json({ participants: event.participants });
// });

// // ---------------------------------------------------
// // ADD ROUTE TO EVENT → Creator Only
// // ---------------------------------------------------
// export const addRouteToEvent = asyncHandler(async (req, res) => {
//   const event = await findEventOrFail(req.params.id);

//   if (String(event.created_by) !== String(req.user._id)) {
//     return res.status(403).json({ message: "Only creator can add a route" });
//   }

//   const { routeId } = req.body;
//   if (!routeId) return res.status(400).json({ message: "routeId is required" });

//   const route = await Route.findById(routeId);
//   if (!route) return res.status(404).json({ message: "Route not found" });

//   event.route = routeId;
//   await event.save();

//   res.json({ message: "Route added to event successfully", event });
// });
























import asyncHandler from "express-async-handler";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Route from "../models/Route.js";
import { sendPushNotification } from "../services/notificationService.js";

// ---------------------------------
// HELPERS
// ---------------------------------
const findEventOrFail = async (id) => {
  const event = await Event.findById(id);
  if (!event) throw { status: 404, message: "Event not found" };
  return event;
};

const validateRoute = async (routeId) => {
  if (!routeId) return null;
  const route = await Route.findById(routeId);
  if (!route || !route.createdBy) throw { status: 400, message: "Invalid route" };
  return route;
};

const notifyUsers = (users, title, message) => {
  users.forEach(u => u.fcmToken && sendPushNotification(u.fcmToken, title, message));
};

// ---------------------------------
// CREATE EVENT → Premium already ensured by middleware
// ---------------------------------
export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, event_date, start_time, location, distance_km, max_participants, route } = req.body;

  const missing = ["title", "event_date", "location"].filter(k => !req.body[k]);
  if (missing.length) return res.status(400).json({ message: `Missing required field(s): ${missing.join(", ")}` });

  const routeDoc = await validateRoute(route);

  const event = await Event.create({
    title,
    description,
    event_date,
    start_time,
    location,
    distance_km,
    max_participants: max_participants || null,
    created_by: req.user._id,
    banner: req.file ? `/uploads/${req.file.filename}` : undefined,
    route: routeDoc?._id
  });

  const users = await User.find({ fcmToken: { $ne: null } }).lean();
  notifyUsers(users, "New Event Published", `Check out the new event: ${event.title} on ${event.event_date}`);

  res.status(201).json({ event });
});

// ---------------------------------
// GET EVENTS (Public)
// ---------------------------------
export const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find()
    .populate("created_by", "name email avatar")
    .populate("route", "name distance difficulty description location elevationMap")
    .sort({ event_date: 1 })
    .lean();

  events.forEach(event => event.likesCount = event.likes?.length || 0);

  res.json({ events });
});

// ---------------------------------
// GET SINGLE EVENT (Public)
// ---------------------------------
export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("created_by", "name email avatar")
    .populate("participants", "name email avatar")
    .populate("route", "name distance difficulty description location elevationMap")
    .lean();

  if (!event) return res.status(404).json({ message: "Event not found" });
  event.likesCount = event.likes?.length || 0;
  res.json({ event });
});

// ---------------------------------
// LIKE / UNLIKE EVENTS
// ---------------------------------
export const likeEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { likes: req.user._id } },
    { new: true }
  ).populate("created_by", "name email avatar")
   .populate("route", "name distance difficulty");

  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ message: "Event liked", event });
});

export const unlikeEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { $pull: { likes: req.user._id } },
    { new: true }
  ).populate("created_by", "name email avatar")
   .populate("route", "name distance difficulty");

  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ message: "Event unliked", event });
});

export const getLikedEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ likes: req.user._id })
    .populate("created_by", "name email avatar")
    .populate("route", "name distance difficulty")
    .sort({ event_date: 1 });

  res.json({ events });
});

// ---------------------------------
// UPDATE EVENT → Creator Only
// ---------------------------------
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await findEventOrFail(req.params.id);

  if (String(event.created_by) !== String(req.user._id)) 
    return res.status(403).json({ message: "Only creator can update this event." });

  const updates = { ...req.body };
  if (req.file) updates.banner = `/uploads/${req.file.filename}`;
  if (updates.route) updates.route = (await validateRoute(updates.route))._id;

  if (updates.max_participants && updates.max_participants < event.participants.length)
    return res.status(400).json({
      message: `Cannot set max participants below current joined users (${event.participants.length})`
    });

  const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

  const participants = await User.find({ _id: { $in: updatedEvent.participants }, fcmToken: { $ne: null } }).lean();
  notifyUsers(participants, "Event Updated", `Event "${updatedEvent.title}" has been updated`);

  res.json({ event: updatedEvent });
});

// ---------------------------------
// DELETE EVENT → Creator Only
// ---------------------------------
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await findEventOrFail(req.params.id);

  if (String(event.created_by) !== String(req.user._id)) 
    return res.status(403).json({ message: "Only creator can delete this event." });

  const participants = await User.find({ _id: { $in: event.participants }, fcmToken: { $ne: null } }).lean();
  notifyUsers(participants, "Event Cancelled", `Event "${event.title}" has been cancelled`);

  await event.deleteOne();
  res.json({ message: "Event deleted" });
});

// ---------------------------------
// JOIN EVENT → Premium ensured by middleware
// ---------------------------------
export const joinEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate("created_by", "name fcmToken");
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (String(event.created_by._id) === String(req.user._id)) 
    return res.status(400).json({ message: "Creator can't join their own event" });
  if (event.participants.includes(req.user._id)) 
    return res.status(400).json({ message: "You already joined this event" });
  if (event.max_participants && event.participants.length >= event.max_participants) 
    return res.status(400).json({ message: "Event is full" });

  event.participants.push(req.user._id);
  await event.save();

  notifyUsers([req.user], "Event Registration Confirmed", `You joined the event: ${event.title} on ${event.event_date}`);
  if (event.created_by.fcmToken) 
    sendPushNotification(event.created_by.fcmToken, "New Participant Joined", `${req.user.name} joined your event: ${event.title}`);

  res.json({ event });
});

// ---------------------------------
// REMOVE PARTICIPANT → Creator Only
// ---------------------------------
export const removeParticipant = asyncHandler(async (req, res) => {
  const event = await findEventOrFail(req.params.id);

  if (String(event.created_by) !== String(req.user._id)) 
    return res.status(403).json({ message: "Only creator can remove participants" });

  const removedUserId = req.params.userId;
  const removedUser = await User.findById(removedUserId);
  if (!removedUser) return res.status(404).json({ message: "Participant not found" });

  event.participants = event.participants.filter(id => String(id) !== String(removedUserId));
  await event.save();

  if (removedUser.fcmToken) {
    try {
      await sendPushNotification(
        removedUser.fcmToken,
        "Removed from Event",
        `You were removed from the event: "${event.title}"`,
        { type: "event_removed", eventId: String(event._id), removedBy: String(req.user._id) }
      );
    } catch (err) { console.error("❌ Failed to send removal notification:", err); }
  }

  res.json({ event });
});

// ---------------------------------
// GET PARTICIPANTS (Public)
// ---------------------------------
export const getParticipants = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate("participants", "name email avatar");
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ participants: event.participants });
});

// ---------------------------------
// ADD ROUTE TO EVENT → Creator Only
// ---------------------------------
export const addRouteToEvent = asyncHandler(async (req, res) => {
  const event = await findEventOrFail(req.params.id);

  if (String(event.created_by) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only creator can add a route" });
  }

  const { routeId } = req.body;
  if (!routeId) return res.status(400).json({ message: "routeId is required" });

  const route = await Route.findById(routeId);
  if (!route) return res.status(404).json({ message: "Route not found" });

  event.route = routeId;
  await event.save();

  res.json({ message: "Route added to event successfully", event });
});
