const { db, admin } = require("../config/firebaseAdmin")

const postsCollection = db.collection("posts")

async function getAllPosts() {
  try {
    const snapshot = await postsCollection.orderBy("createdAt", "desc").get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Error al obtener posts:", error)
    throw new Error("Error al obtener los posts.")
  }
}

async function createPost(postData) {
  try {
    const newPost = {
      ...postData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    const docRef = await postsCollection.add(newPost)
    return { id: docRef.id, ...newPost }
  } catch (error) {
    console.error("Error al crear post:", error)
    throw new Error("Error al crear el post.")
  }
}

async function updatePost(postId, postData) {
  try {
    const postRef = postsCollection.doc(postId)
    const updatedData = {
      ...postData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    await postRef.update(updatedData)
    return { id: postId, ...updatedData }
  } catch (error) {
    console.error("Error al actualizar post:", error)
    throw new Error("Error al actualizar el post.")
  }
}

async function deletePost(postId) {
  try {
    await postsCollection.doc(postId).delete()
  } catch (error) {
    console.error("Error al eliminar post:", error)
    throw new Error("Error al eliminar el post.")
  }
}

module.exports = {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
}
