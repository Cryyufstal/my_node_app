const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  try {
    const { title, content, excerpt, categories, tags, featuredImage } = req.body;

    const post = new Post({
      title,
      content,
      excerpt,
      categories: categories || [],
      tags: tags || [],
      featuredImage,
      author: req.user._id
    });

    await post.save();
    await post.populate('author', 'username profile');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      tag,
      status = 'published',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { status };

    // البحث
    if (search) {
      query.$text = { $search: search };
    }

    // التصنيفات
    if (category) {
      query.categories = category;
    }

    // الوسوم
    if (tag) {
      query.tags = tag;
    }

    // الترتيب
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const posts = await Post.find(query)
      .populate('author', 'username profile')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

exports.getPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({ slug })
      .populate('author', 'username profile firstName lastName');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // زيادة عدد المشاهدات
    if (post.status === 'published') {
      post.meta.views += 1;
      await post.save();
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

    const post = await Post.findOne({ slug });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // التحقق من الملكية (ما عدا المدير)
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied, you can only update your own posts'
      });
    }

    // إذا تم النشر، إضافة تاريخ النشر
    if (updateData.status === 'published' && post.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    Object.keys(updateData).forEach(key => {
      post[key] = updateData[key];
    });

    await post.save();
    await post.populate('author', 'username profile');

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({ slug });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // التحقق من الملكية (ما عدا المدير)
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied, you can only delete your own posts'
      });
    }

    await Post.findByIdAndDelete(post._id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};