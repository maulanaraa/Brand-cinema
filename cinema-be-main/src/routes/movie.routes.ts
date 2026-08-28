import { Router } from 'express';
import * as movieController from '../controllers/movie.controller';
import { authenticate, authorizeAdmin, validate } from '../middlewares';
import {
  createMovieValidator,
  updateMovieValidator,
  movieIdValidator,
  movieQueryValidator,
  tmdbSearchValidator,
  tmdbIdValidator,
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/movies:
 *   get:
 *     tags: [Movies]
 *     summary: List movies
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: genre
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [NOW_PLAYING, COMING_SOON] }
 *     responses:
 *       200:
 *         description: Movie list
 */
router.get('/', movieQueryValidator, validate, movieController.getMovies);

/**
 * @swagger
 * /api/movies/tmdb/search:
 *   get:
 *     tags: [Movies]
 *     summary: Search movies on TMDB (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: TMDB search results
 */
router.get(
  '/tmdb/search',
  authenticate,
  authorizeAdmin,
  tmdbSearchValidator,
  validate,
  movieController.searchTmdbMovies
);

/**
 * @swagger
 * /api/movies/tmdb/genres:
 *   get:
 *     tags: [Movies]
 *     summary: List TMDB genres (Admin)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: TMDB genre list
 */
router.get(
  '/tmdb/genres',
  authenticate,
  authorizeAdmin,
  movieController.getTmdbGenres
);

router.post(
  '/tmdb/sync-indonesia',
  authenticate,
  authorizeAdmin,
  movieController.syncIndonesiaMovies
);

/**
 * @swagger
 * /api/movies/tmdb/{tmdbId}:
 *   get:
 *     tags: [Movies]
 *     summary: Get TMDB movie details for import (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: tmdbId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: TMDB movie import payload
 */
router.get(
  '/tmdb/:tmdbId',
  authenticate,
  authorizeAdmin,
  tmdbIdValidator,
  validate,
  movieController.getTmdbMovieImport
);

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     tags: [Movies]
 *     summary: Get movie by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie details
 *       404:
 *         description: Movie not found
 */
router.get('/:id', movieIdValidator, validate, movieController.getMovieById);

/**
 * @swagger
 * /api/movies:
 *   post:
 *     tags: [Movies]
 *     summary: Create movie (Admin)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, genre, description, duration, language, releaseDate]
 *             properties:
 *               title: { type: string }
 *               genre: { type: string }
 *               description: { type: string }
 *               duration: { type: integer, minimum: 1 }
 *               rating: { type: number, minimum: 0, maximum: 10 }
 *               poster: { type: string, format: uri }
 *               trailerUrl: { type: string, format: uri }
 *               tmdbId: { type: integer, minimum: 1 }
 *               language: { type: string }
 *               releaseDate: { type: string, format: date }
 *               status: { type: string, enum: [NOW_PLAYING, COMING_SOON] }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Movie created
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  createMovieValidator,
  validate,
  movieController.createMovie
);

/**
 * @swagger
 * /api/movies/{id}:
 *   put:
 *     tags: [Movies]
 *     summary: Update movie (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               genre: { type: string }
 *               description: { type: string }
 *               duration: { type: integer, minimum: 1 }
 *               rating: { type: number, minimum: 0, maximum: 10 }
 *               poster: { type: string, format: uri }
 *               trailerUrl: { type: string, format: uri }
 *               tmdbId: { type: integer, minimum: 1 }
 *               language: { type: string }
 *               releaseDate: { type: string, format: date }
 *               status: { type: string, enum: [NOW_PLAYING, COMING_SOON] }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Movie updated
 */
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  updateMovieValidator,
  validate,
  movieController.updateMovie
);

/**
 * @swagger
 * /api/movies/{id}:
 *   delete:
 *     tags: [Movies]
 *     summary: Soft delete movie (Admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Movie deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  movieIdValidator,
  validate,
  movieController.deleteMovie
);

export default router;
