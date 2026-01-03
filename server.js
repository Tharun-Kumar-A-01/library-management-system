const Book = require("./models/book")
const express = require("express")
const mongoose = require("mongoose")

const app = express()
app.use(express.json())

mongoose
  .connect("mongodb://127.0.0.1:27017/libraryDB")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err))

/* ---------------- CREATE ---------------- */
// Insert a book
app.post("/", async (req, res) => {
  try {
    const book = new Book(req.body)
    await book.save()
    res.status(201).json(book)
  } catch (err) {
    res.status(400).json({ error: "Invalid book data" })
  }
})

/* ---------------- READ ---------------- */

// 1. All books
app.get("/", async (req, res) => {
  const books = await Book.find()
  res.json(books)
})

// 2. Single Book
app.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)

    if (!book) {
      return res.status(404).json({ error: "Book not found" })
    }

    res.json(book)
  } catch (err) {
    res.status(400).json({ error: "Invalid book ID" })
  }
})

// 3. Books by category
app.get("/category/:category", async (req, res) => {
  const books = await Book.find({ category: req.params.category })
  res.json(books)
})

// 4. Books after year 2015
app.get("/after/:year", async (req, res) => {
  const books = await Book.find({ publishedYear: { $gt: req.params.year } })
  res.json(books)
})

/* ---------------- UPDATE ---------------- */

// Increase / decrease copies
app.patch("/:id/copies", async (req, res) => {
  const { addCopies } = req.body

  if (typeof addCopies !== "number") {
    return res.status(400).json({ error: "Invalid update" })
  }

  const book = await Book.findById(req.params.id)
  if (!book) {
    return res.status(404).json({ error: "Book not found" })
  }

  if (book.availableCopies + addCopies < 0) {
    return res.status(400).json({ error: "Negative stock not allowed" })
  }

  book.availableCopies += addCopies
  await book.save()

  res.json(book)
})

// Change category
app.patch("/:id/category", async (req, res) => {
  const { category } = req.body

  if (!category) {
    return res.status(400).json({ error: "Invalid update" })
  }

  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { category },
    { new: true }
  )

  if (!book) {
    return res.status(404).json({ error: "Book not found" })
  }

  res.json(book)
})

/* ---------------- DELETE ---------------- */

// Remove book if copies = 0
app.delete("/:id", async (req, res) => {
  const book = await Book.findById(req.params.id)

  if (!book) {
    return res.status(404).json({ error: "Book not found" })
  }

  if (book.availableCopies !== 0) {
    return res.status(400).json({
      error: "Cannot delete book with available copies"
    })
  }

  await book.deleteOne()
  res.json({ message: "Book removed successfully" })
})


const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
