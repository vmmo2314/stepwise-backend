const postService = require("../services/postService")

async function getAllPosts(req, res) {
  try {
    const posts = await postService.getAllPosts()
    res.status(200).json(posts)
  } catch (error) {
    console.error("Error en controller getAllPosts:", error)
    res.status(500).json({ error: error.message })
  }
}

async function createPost(req, res) {
  try {
    const postData = req.body
    // Opcional: Asignar el autor del post desde el usuario autenticado
    postData.authorUid = req.user.uid
    const newPost = await postService.createPost(postData)
    res.status(201).json(newPost)
  } catch (error) {
    console.error("Error en controller createPost:", error)
    res.status(500).json({ error: error.message })
  }
}

async function updatePost(req, res) {
  try {
    const { id } = req.params
    const postData = req.body
    const updatedPost = await postService.updatePost(id, postData)
    res.status(200).json(updatedPost)
  } catch (error) {
    console.error("Error en controller updatePost:", error)
    res.status(500).json({ error: error.message })
  }
}

async function deletePost(req, res) {
  try {
    const { id } = req.params
    await postService.deletePost(id)
    res.status(204).send() // No Content
  } catch (error) {
    console.error("Error en controller deletePost:", error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
}
