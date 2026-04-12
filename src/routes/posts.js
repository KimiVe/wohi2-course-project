const express = require("express");
const router = express.Router();
const posts = require("../data/posts");


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


router.get("/:postid", (req, res) => {
  const postid = Number(req.params.postid);

  const post = posts.find((p) => p.id === postid);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  res.json(post);
});

//add
router.post("/", (req, res) => {
  const { question, answer, country,} = req.body;

  if (!question || !answer || !country) {
    return res.status(400).json({
      message: "Question, answer and country are required"
    });
  }
  const maxId = Math.max(...posts.map(p => p.id), 0);

  const newPost = {
    id: posts.length ? maxId + 1 : 1,
    question, answer, country,
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

//edit
router.put("/:postId", (req, res) => {
  const postId = Number(req.params.postId);
  const { question, answer, country} = req.body || {};;

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!question || !answer || !country) {
    return res.json({
      message: "question, answer, and country are required"
    });
  }

  post.question = question;
  post.answer = answer;
  post.country = country;

  res.json(post);
});

//DELETE

router.delete("/:postId", (req, res) => {
  const postId = Number(req.params.postId);

  const postIndex = posts.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ message: "Post not found" });
  }

  const deletedPost = posts.splice(postIndex, 1);

  res.json({
    message: "Post deleted successfully",
    post: deletedPost[0]
  });
});


module.exports = router;