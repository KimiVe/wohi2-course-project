const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const posts = require("../data/posts");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");


router.use(authenticate);

function formatPost(post) {
  return {
    ...post,
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
});


router.get("/:postId", async (req, res) => {
  const postId = Number(req.params.postId);
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { keywords: true },
  });

  if (!post) {
    return res.status(404).json({ 
		message: "Post not found" 
    });
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


module.exports = router;