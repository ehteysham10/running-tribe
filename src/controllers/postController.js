
// import mongoose from 'mongoose';
// import Post from '../models/Post.js';

// // -------------------------
// // Helpers
// // -------------------------
// const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// const findPostByIdOrFail = async (postId) => {
//   if (!isValidObjectId(postId)) throw { status: 400, message: "Invalid postId" };
//   const post = await Post.findById(postId);
//   if (!post) throw { status: 404, message: "Post not found" };
//   return post;
// };

// const requireTextOrImage = (text, image, action = "Post") => {
//   if (!text && !image) throw { status: 400, message: `${action} must include text or image` };
// };

// // Async handler wrapper — removes repeated try/catch
// const asyncHandler = (fn) => (req, res, next) =>
//   Promise.resolve(fn(req, res, next)).catch(next);

// // -------------------------
// // CREATE POST
// // -------------------------
// export const createPost = asyncHandler(async (req, res) => {
//   const text = req.body?.text?.trim() || null;
//   const image = req.file?.filename || null;

//   requireTextOrImage(text, image);

//   // Basic user daily post limit
//   if (req.user.membership === "basic") {
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);

//     const postsToday = await Post.countDocuments({
//       userId: req.user.id,
//       createdAt: { $gte: startOfDay }
//     });

//     if (postsToday >= 2) {
//       return res.status(403).json({
//         message: "Daily post limit reached. Upgrade to premium to post more."
//       });
//     }
//   }

//   const newPost = await Post.create({
//     userId: req.user.id,
//     text,
//     image
//   });

//   res.status(201).json({
//     message: "Post created successfully",
//     post: newPost
//   });
// });

// // -------------------------
// // GET ALL POSTS
// // -------------------------
// export const getAllPosts = asyncHandler(async (req, res) => {
//   const posts = await Post.find()
//     .populate("userId", "name email profilePic")
//     .populate("comments.userId", "name profilePic")
//     .sort({ createdAt: -1 });

//   res.json(posts);
// });

// // -------------------------
// // GET SINGLE POST
// // -------------------------
// export const getPostById = asyncHandler(async (req, res) => {
//   const { postId } = req.params;

//   if (!isValidObjectId(postId)) {
//     return res.status(400).json({ message: "Invalid postId" });
//   }

//   const post = await Post.findById(postId)
//     .populate("userId", "name email profilePic")
//     .populate("comments.userId", "name profilePic");

//   if (!post) return res.status(404).json({ message: "Post not found" });

//   res.json(post);
// });

// // -------------------------
// // UPDATE POST
// // -------------------------
// export const updatePost = asyncHandler(async (req, res) => {
//   const { postId } = req.params;
//   const text = req.body?.text?.trim() || null;
//   const newImage = req.file?.filename || null;

//   const post = await findPostByIdOrFail(postId);

//   if (post.userId.toString() !== req.user.id) {
//     return res.status(403).json({ message: "Not authorized to update this post" });
//   }

//   requireTextOrImage(text, newImage, "Update");

//   if (text) post.text = text;
//   if (newImage) post.image = newImage;

//   await post.save();

//   res.json({ message: "Post updated successfully", post });
// });

// // -------------------------
// // DELETE POST
// // -------------------------
// export const deletePost = asyncHandler(async (req, res) => {
//   const post = await findPostByIdOrFail(req.params.postId);

//   if (post.userId.toString() !== req.user.id) {
//     return res.status(403).json({ message: "Not authorized to delete this post" });
//   }

//   await post.deleteOne();
//   res.json({ message: "Post deleted successfully" });
// });

// // -------------------------
// // LIKE / UNLIKE POST
// // -------------------------
// export const likePost = asyncHandler(async (req, res) => {
//   const { postId } = req.params;
//   const userId = req.user.id;

//   const post = await findPostByIdOrFail(postId);

//   const hasLiked = post.likes.includes(userId);

//   await Post.findByIdAndUpdate(
//     postId,
//     hasLiked
//       ? { $pull: { likes: userId } }
//       : { $addToSet: { likes: userId } }
//   );

//   const updated = await Post.findById(postId);
//   res.json({ message: "Like updated", likes: updated.likes.length });
// });

// // -------------------------
// // ADD COMMENT (Premium only)
// // -------------------------
// export const addComment = asyncHandler(async (req, res) => {
//   const { postId } = req.params;
//   const { comment } = req.body;

//   // PREMIUM ONLY RULE
//   if (req.user.membership !== "premium") {
//     return res.status(403).json({
//       message: "Comments are a premium-only feature. Upgrade to comment."
//     });
//   }

//   if (!comment || !comment.trim()) {
//     return res.status(400).json({ message: "Comment cannot be empty" });
//   }

//   if (comment.trim().length > 50) {
//     return res.status(400).json({ message: "Comment cannot exceed 50 characters" });
//   }

//   const post = await findPostByIdOrFail(postId);

//   post.comments.push({
//     userId: req.user.id,
//     text: comment.trim(),
//   });

//   await post.save();

//   res.json({ message: "Comment added", comments: post.comments });
// });

// // -------------------------
// // DELETE COMMENT
// // -------------------------
// export const deleteComment = asyncHandler(async (req, res) => {
//   const { postId, commentId } = req.params;

//   if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
//     return res.status(400).json({ message: "Invalid postId or commentId" });
//   }

//   const post = await findPostByIdOrFail(postId);
//   const comment = post.comments.id(commentId);

//   if (!comment) {
//     return res.status(404).json({ message: "Comment not found" });
//   }

//   const isOwner = comment.userId.toString() === req.user.id;
//   const isPostOwner = post.userId.toString() === req.user.id;

//   if (!isOwner && !isPostOwner) {
//     return res.status(403).json({ message: "Not authorized to delete this comment" });
//   }

//   post.comments = post.comments.filter((c) => c._id.toString() !== commentId);
//   await post.save();

//   res.json({ message: "Comment deleted successfully", comments: post.comments });
// });






















import mongoose from 'mongoose';
import Post from '../models/Post.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const findPostByIdOrFail = async (postId) => {
  if (!isValidObjectId(postId)) throw { status: 400, message: "Invalid postId" };
  const post = await Post.findById(postId);
  if (!post) throw { status: 404, message: "Post not found" };
  return post;
};

const requireTextOrImage = (text, image, action = "Post") => {
  if (!text && !image) throw { status: 400, message: `${action} must include text or image` };
};

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// -------------------------
// CREATE POST
// -------------------------
export const createPost = asyncHandler(async (req, res) => {
  const text = req.body?.text?.trim() || null;
  const image = req.file?.filename || null;

  requireTextOrImage(text, image);

  // Basic user daily post limit
  if (req.user.membership === "basic") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const postsToday = await Post.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: startOfDay }
    });

    if (postsToday >= 2) {
      return res.status(403).json({
        message: "Daily post limit reached. Upgrade to premium to post more."
      });
    }
  }

  const newPost = await Post.create({
    userId: req.user.id,
    text,
    image
  });

  res.status(201).json({
    message: "Post created successfully",
    post: newPost
  });
});

// -------------------------
// GET POSTS
// -------------------------
export const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("userId", "name email profilePic")
    .populate("comments.userId", "name profilePic")
    .sort({ createdAt: -1 });
  res.json(posts);
});

export const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) return res.status(400).json({ message: "Invalid postId" });

  const post = await Post.findById(postId)
    .populate("userId", "name email profilePic")
    .populate("comments.userId", "name profilePic");

  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json(post);
});

// -------------------------
// UPDATE POST
// -------------------------
export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const text = req.body?.text?.trim() || null;
  const newImage = req.file?.filename || null;

  const post = await findPostByIdOrFail(postId);

  if (post.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized to update this post" });
  }

  requireTextOrImage(text, newImage, "Update");

  if (text) post.text = text;
  if (newImage) post.image = newImage;

  await post.save();

  res.json({ message: "Post updated successfully", post });
});

// -------------------------
// DELETE POST
// -------------------------
export const deletePost = asyncHandler(async (req, res) => {
  const post = await findPostByIdOrFail(req.params.postId);

  if (post.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized to delete this post" });
  }

  await post.deleteOne();
  res.json({ message: "Post deleted successfully" });
});

// -------------------------
// LIKE POST
// -------------------------
export const likePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const post = await findPostByIdOrFail(postId);
  const hasLiked = post.likes.includes(userId);

  await Post.findByIdAndUpdate(
    postId,
    hasLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } }
  );

  const updated = await Post.findById(postId);
  res.json({ message: "Like updated", likes: updated.likes.length });
});

// -------------------------
// ADD COMMENT → Premium enforced by middleware
// -------------------------
export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { comment } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }

  if (comment.trim().length > 50) {
    return res.status(400).json({ message: "Comment cannot exceed 50 characters" });
  }

  const post = await findPostByIdOrFail(postId);

  post.comments.push({
    userId: req.user.id,
    text: comment.trim(),
  });

  await post.save();

  res.json({ message: "Comment added", comments: post.comments });
});

// -------------------------
// DELETE COMMENT
// -------------------------
export const deleteComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;

  if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
    return res.status(400).json({ message: "Invalid postId or commentId" });
  }

  const post = await findPostByIdOrFail(postId);
  const comment = post.comments.id(commentId);

  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const isOwner = comment.userId.toString() === req.user.id;
  const isPostOwner = post.userId.toString() === req.user.id;

  if (!isOwner && !isPostOwner) {
    return res.status(403).json({ message: "Not authorized to delete this comment" });
  }

  post.comments = post.comments.filter((c) => c._id.toString() !== commentId);
  await post.save();

  res.json({ message: "Comment deleted successfully", comments: post.comments });
});
