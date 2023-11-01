const { Router } = require("express");
const route = Router();

const Book = require("../models/Book");

// Elasticsearch client
const { Client } = require("@elastic/elasticsearch");
const elasticClient = new Client({
    node: process.env.ELASTIC_CLUSTER_ENDPOINT,
    auth: {
        username: process.env.ELASTIC_USERNAME,
        password: process.env.ELASTIC_PASSWORD,
    },
});

/**
 * POST request to create a new book
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

        // create the book in mongodb collection
        const result = await Book.create(newBook);

        // elastic search index step
        const { statusCode, body } = await elasticClient.index({
            index: "books", // Index name
            id: result._id, // _id from mongo result
            body: newBook, // newBook object
        });
        console.log(body);
        console.log(statusCode);
        if (statusCode === 201) {
            console.log(
                "Document indexed in elastic cloud successfully:",
                body
            );
        } else {
            console.log("Unexpected status code:", statusCode);
        }

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
        // find all the books in mongo collection and return
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

        // find the book by id in mongo collection and return
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
        // get the request body parameters
        const { title, author, publication, isbn, description } = req.body;

        const updatedDetails = {
            title: title,
            author: author,
            publication: publication,
            isbn: isbn,
            description: description,
        };

        // find the book by id and update it, then return updated book in response
        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            { $set: updatedDetails },
            { new: true } // mongo returns the updated document
        );

        // Update the book in Elasticsearch
        const { statusCode, body } = await elasticClient.update({
            index: "books", // Elasticsearch index name
            id: bookId, // Use the book's ID for Elasticsearch
            body: {
                doc: updatedDetails, // Updated book data
            },
        });

        if (statusCode === 200) {
            console.log("Elasticsearch: Document updated successfully");
        } else {
            console.log("Elasticsearch: Unexpected status code:", statusCode);
        }

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

        // find the book by id and delete
        const deletedBook = await Book.findByIdAndRemove(bookId);

        // Delete the book from Elasticsearch
        const { statusCode, body } = await elasticClient.delete({
            index: "books", // Elasticsearch index name
            id: bookId, // Use the book's ID for Elasticsearch
        });

        if (statusCode === 200) {
            console.log("Elasticsearch: Document deleted successfully");
        } else {
            console.log("Elasticsearch: Unexpected status code:", statusCode);
        }

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

/**
 * SEARCH API
 */
route.get("/search/query", async function (req, res, next) {
    try {
        const { query } = req.query;

        console.log(query);
        if (!query) {
            return res
                .status(400)
                .json({ error: "Query parameter is required" });
        }

        // Elasticsearch search api
        const { body } = await elasticClient.search({
            index: "books",
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ["title", "author", "description"],
                        operator: "and",
                    },
                },
            },
        });
        console.log(body);
        console.log(JSON.stringify(body, null, 2));

        if (body && body.hits) {
            const searchResults = body.hits.hits.map((hit) => hit._source);
            console.log(searchResults);
            return res.json(searchResults);
        } else {
            return res.status(500).json({ error: "No search results found" });
        }
    } catch (error) {
        next(error);
        console.log(error);
    }
});

module.exports = route;
