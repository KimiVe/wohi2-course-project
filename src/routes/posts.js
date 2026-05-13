const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

const multer = require("multer");



//ZOD


const { z } = require("zod");

const PostInput = z.object({
  title: z.string().min(1),
  date: z.string().date(),
  content: z.string().min(1),
  keywords: z.union([z.string(), z.array(z.string())]).optional(),
});

router.post("/", upload.single("image"), async (req, res) => {
  const data = PostInput.parse(req.body); // throws ZodError on failure
  // ...rest unchanged, using `data.title` etc.
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError ||
      err?.message === "Only image files are allowed") {
    return res.status(400).json({ msg: err.message });
  }
  next(err); // pass through to global handler
});




// MULTER



const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new ValidationError("Only image files are allowed"));
},
  limits: { fileSize: 5 * 1024 * 1024 },
});



// This throws an error I didn't really get how to fix.


/* const posts = await prisma.post.findMany({
    where,
    include: { keywords: true, user: true },
    orderBy: { id: "asc" }
}); */

// IMAGE POSTS

router.post("/", upload.single("image"), async (req, res) => {
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  await prisma.post.create({ data: {imageUrl } });
});

router.put("/:postId", upload.single("image"), isOwner, async (req, res) => {
  const data = {};
  
  await prisma.post.update({ where: { id }, data });
});
if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;



// HELPER KEYWORDS
function parseKeywords(keywords) {
  if (Array.isArray(keywords)) return keywords;
  if (typeof keywords === "string") {
    return keywords.split(",").map((k) => k.trim()).filter(Boolean);
  }
  return [];
}

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError ||
        err?.message === "Only image files are allowed") {
        return res.status(400).json({ msg: err.message });
    }
    next(err);
});


//

router.use(authenticate);

function formatPost(post) {
  return {
    ...post,
    date: post.date.toISOString().split("T")[0],
    keywords: post.keywords.map((k) => k.name),
    userName: post.user?.name || null,
    likeCount: post._count?.likes ?? 0,
    liked: post.likes ? post.likes.length > 0 : false,
    user: undefined,
    likes: undefined,
    _count: undefined,
  };
}



router.get("/", (req, res) => {
  const { country } = req.query;

  if (!country) {
    return res.json(posts);
  }

  const filteredPosts = posts.filter(post =>
    post.country.includes(country.toLowerCase())
  );

  res.json(filteredPosts);


  //const page;
  //const limit;
  //const skip;
});


router.get("/:postId", async (req, res) => {
    const postId = Number(req.params.postId);
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            keywords: true,
            user: true,
            likes: { where: { userId: req.user.userId }, take: 1 },
            _count: { select: { likes: true } },
        },
    });

    if (!post) {
        return res.status(404).json({message: "Post not found"});
    }
    res.json(formatPost(post));
});



//add
router.post("/", isOwner, async (req, res) => {
  const { question, answer, country} = req.body;

  if (!question || !answer || !country) {
    return res.status(400).json({ msg: 
	"Question,Answer and country are mandatory" });
  }

  //const keywordsArray = Array.isArray(keywords) ? keywords : [];

  const newPost = await prisma.post.create({
    data: {
      question, answer, country,
      userId: req.user.userId,
      //keywords: {
        //connectOrCreate: keywordsArray.map((kw) => ({
          //where: { name: kw }, create: { name: kw },
        //})), },
    },
    //include: { keywords: true },
  });

  res.status(201).json(formatPost(newPost));
});


//edit
router.put("/:postId", isOwner, async (req, res) => {
  const postId = Number(req.params.postId);
  const { question, answer, country } = req.body;
  const existingPost = await prisma.post.findUnique({ where: { id: postId } });
  if (!existingPost) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!question || !answer || !country) {
    return res.status(400).json({ msg: "Question,answer and country are mandatory" });
  }
  res.json(formatPost(updatedPost));
});


//DELETE

router.delete("/:postId", isOwner, async (req, res) => {
  const postId = Number(req.params.postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  await prisma.post.delete({ where: { id: postId } });

  res.json({
    message: "Post deleted successfully",
    post: formatPost(post),
  });
});

// like endpoint 


router.post("/:postId/like", async (req, res) => {
    const postId = Number(req.params.postId);

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    const like = await prisma.like.upsert({
        where: { userId_postId: { userId: req.user.userId, postId } },
        update: {},
        create: { userId: req.user.userId, postId },
    });

    const likeCount = await prisma.like.count({ where: { postId } });

    res.status(201).json({
        id: like.id,
        postId,
        liked: true,
        likeCount,
        createdAt: like.createdAt,
    });
});



// unlike endpoint
router.delete("/:postId/like", async (req, res) => {
    const postId = Number(req.params.postId);

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    await prisma.like.deleteMany({
        where: { userId: req.user.userId, postId },
    });

    const likeCount = await prisma.like.count({ where: { postId } });

    res.json({ postId, liked: false, likeCount });
});


module.exports = router;


