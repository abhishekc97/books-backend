const { Router } = require("express");
const route = Router();

const Book = require("../models/Book");

/**
 * POST requet to create a new book
 */
route.post("/create-book", async function (req, res, next) {
    try {
        const { title, author, publication, isbn, description } = req.body;
        if (!title) {
            return res
                .status(400)
                .send(
                    "Bad request, check given parameters, product must have name"
                );
        }

        const newBook = {
            title: title,
            author: author,
            publication: publication,
            isbn: isbn,
            description: description,
        };

        const result = await Book.create(newBook);

        if (!result) {
            return res.status(400).send("Could not create a new book entry.");
        }
        return res
            .status(200)
            .send("Your new book has been saved successfully.");
    } catch (error) {
        console.log(error);
        next(error);
    }
});

/**
 * GET request to get all books
 */
route.get("/all", async function (req, res, next) {
    try {
        const results = await Book.find({});

        if (!results) {
            return res.status(400).send("Could not fetch books");
        }

        return res.status(200).json(results);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

/**
 * GET request to get a book by its id
 */
route.get("/:id", async function (req, res, next) {
    try {
        const bookId = req.params.id;

        if (!bookId) {
            return res
                .status(400)
                .send(
                    "Bad request, check given parameters. Please include book id."
                );
        }

        const result = await Book.findById(bookId);

        if (!result) {
            res.status(400).send("Could not fetch books");
        }

        return res.status(200).json(result);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

/**
 * PUT request to update details of a book
 */
route.put("/update/:id", async function (req, res, next) {
    try {
        const bookId = req.params.id;

        if (!bookId) {
            return res
                .status(400)
                .send(
                    "Bad request, check given parameters. Please include book id."
                );
        }

        const { title, author, publication, isbn, description } = req.body;

        const updatedDetails = {
            title: title,
            author: author,
            publication: publication,
            isbn: isbn,
            description: description,
        };

        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            { $set: updatedDetails },
            { new: true } // mongo returns the updated document
        );

        return res.status(200).json(updatedBook);
    } catch (error) {
        console.log(error);
        next(error);
    }
});

/**
 * DELETE request to delete a book
 */
route.delete("/delete/:id", async function (req, res, next) {
    try {
        const bookId = req.params.id;
        if (!bookId) {
            return res
                .status(400)
                .send(
                    "Bad request, check given parameters. Please include book id."
                );
        }

        const deletedBook = await Book.findByIdAndRemove(bookId);

        if (!deletedBook) {
            return res.status(404).json("Book not found");
        }

        return res
            .status(200)
            .json({ message: "Book deleted successfully", deletedBook });
    } catch (error) {
        console.log(error);
        next(error);
    }
});

module.exports = route;
