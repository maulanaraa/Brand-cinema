import '../config/dns';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { userRepository } from '../repositories/user.repository';
import { movieRepository } from '../repositories/movie.repository';
import { showtimeRepository } from '../repositories/showtime.repository';
import { concessionRepository } from '../repositories/concession.repository';
import { hallRepository } from '../repositories/hall.repository';
import { cityRepository } from '../repositories/city.repository';
import { cinemaRepository } from '../repositories/cinema.repository';
import { hashPassword } from '../utils/auth.util';
import { logger } from '../utils/logger.util';
import { UserRole } from '../types';
import { IShowtime } from '../models/Showtime';
import { ICity } from '../models/City';

const seed = async (): Promise<void> => {
  try {
    await connectDatabase();

    logger.info('Seeding database...');

    const adminPassword = await hashPassword('Admin@123');
    const userPassword = await hashPassword('User@1234');

    let admin = await userRepository.findByEmail('admin@cinema.com');
    if (!admin) {
      admin = await userRepository.create({
        name: 'Admin User',
        email: 'admin@cinema.com',
        password: adminPassword,
        role: UserRole.ADMIN,
      });
      logger.info('Admin created: admin@cinema.com / Admin@123');
    }

    let user = await userRepository.findByEmail('user@cinema.com');
    if (!user) {
      user = await userRepository.create({
        name: 'Regular User',
        email: 'user@cinema.com',
        password: userPassword,
        role: UserRole.USER,
      });
      logger.info('User created: user@cinema.com / User@1234');
    }

    const existingMovies = await movieRepository.count();
    if (existingMovies === 0) {
      const movies = await Promise.all([
        movieRepository.create({
          title: 'Inception',
          genre: 'Sci-Fi',
          description:
            'A thief who steals corporate secrets through dream-sharing technology.',
          duration: 148,
          rating: 8.8,
          poster: '',
          trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
          language: 'English',
          releaseDate: new Date('2010-07-16'),
          isActive: true,
        }),
        movieRepository.create({
          title: 'The Dark Knight',
          genre: 'Action',
          description: 'Batman faces the Joker in Gotham City.',
          duration: 152,
          rating: 9.0,
          poster: '',
          trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
          language: 'English',
          releaseDate: new Date('2008-07-18'),
          isActive: true,
        }),
        movieRepository.create({
          title: 'Interstellar',
          genre: 'Sci-Fi',
          description: 'A team of explorers travel through a wormhole in space.',
          duration: 169,
          rating: 8.6,
          poster: '',
          trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
          language: 'English',
          releaseDate: new Date('2014-11-07'),
          isActive: true,
        }),
        movieRepository.create({
          title: 'Parasite',
          genre: 'Thriller',
          description: 'A poor family schemes to become employed by a wealthy family.',
          duration: 132,
          rating: 8.5,
          poster: '',
          trailerUrl: 'https://www.youtube.com/watch?v=5xH0HfJHsaY',
          language: 'Korean',
          releaseDate: new Date('2019-05-30'),
          isActive: true,
        }),
      ]);

      logger.info(`Created ${movies.length} movies`);

      const tomorrow = dayjs().add(1, 'day').toDate();
      const dayAfter = dayjs().add(2, 'day').toDate();

      const showtimes: Partial<IShowtime>[] = [
        {
          movieId: movies[0]._id as unknown as IShowtime['movieId'],
          studio: 'Studio 1',
          date: tomorrow,
          time: '14:00',
          price: 50000,
          totalSeat: 50,
          bookedSeats: [],
        },
        {
          movieId: movies[0]._id as unknown as IShowtime['movieId'],
          studio: 'Studio 1',
          date: tomorrow,
          time: '19:00',
          price: 65000,
          totalSeat: 50,
          bookedSeats: [],
        },
        {
          movieId: movies[1]._id as unknown as IShowtime['movieId'],
          studio: 'Studio 2',
          date: tomorrow,
          time: '16:00',
          price: 55000,
          totalSeat: 60,
          bookedSeats: [],
        },
        {
          movieId: movies[2]._id as unknown as IShowtime['movieId'],
          studio: 'Studio 3',
          date: dayAfter,
          time: '13:00',
          price: 50000,
          totalSeat: 40,
          bookedSeats: [],
        },
        {
          movieId: movies[3]._id as unknown as IShowtime['movieId'],
          studio: 'Studio 1',
          date: dayAfter,
          time: '20:00',
          price: 70000,
          totalSeat: 50,
          bookedSeats: [],
        },
      ];

      for (const st of showtimes) {
        await showtimeRepository.create(st);
      }

      logger.info(`Created ${showtimes.length} showtimes`);
    } else {
      logger.info('Movies already exist, skipping movie/showtime seed');
    }

    const existingConcessions = await concessionRepository.count();
    if (existingConcessions === 0) {
      const concessions = [
        {
          name: 'Combo Hemat',
          description: 'Medium popcorn + minuman',
          price: 55000,
          category: 'combo' as const,
          imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400',
          badge: 'Best Value',
          isActive: true,
          sortOrder: 0,
        },
        {
          name: 'Large Popcorn',
          description: 'Butter popcorn segar',
          price: 35000,
          category: 'popcorn' as const,
          imageUrl: 'https://images.unsplash.com/photo-1585647349843-7a2c5e7f1fbb?w=400',
          isActive: true,
          sortOrder: 1,
        },
        {
          name: 'Ice Lemon Tea',
          description: 'Teh lemon dingin',
          price: 25000,
          category: 'drinks' as const,
          imageUrl: 'https://images.unsplash.com/photo-1556675593-ef6e8f96773a?w=400',
          isActive: true,
          sortOrder: 2,
        },
      ];

      for (const item of concessions) {
        await concessionRepository.create(item);
      }

      logger.info(`Created ${concessions.length} concessions`);
    } else {
      logger.info('Concessions already exist, skipping concession seed');
    }

    const existingHalls = await hallRepository.findAll({
      page: 1,
      limit: 1,
      skip: 0,
      sort: { name: 1 },
    });
    if (existingHalls.pagination.total === 0) {
      const halls = [
        { name: 'Studio 1', totalSeats: 50, layoutRows: 5, layoutColumns: 10, isActive: true },
        { name: 'Studio 2', totalSeats: 60, layoutRows: 6, layoutColumns: 10, isActive: true },
        { name: 'Studio 3', totalSeats: 40, layoutRows: 5, layoutColumns: 8, isActive: true },
      ];

      for (const hall of halls) {
        await hallRepository.create(hall);
      }

      logger.info(`Created ${halls.length} halls`);
    } else {
      logger.info('Halls already exist, skipping hall seed');
    }

    const existingCities = await cityRepository.findAll({
      page: 1,
      limit: 1,
      skip: 0,
      sort: { sortOrder: 1 },
    });

    let jakarta: ICity | null = null;
    if (existingCities.pagination.total === 0) {
      jakarta = await cityRepository.create({
        name: 'Jakarta',
        slug: 'jakarta',
        isActive: true,
        sortOrder: 1,
      });
      await cityRepository.create({
        name: 'Bandung',
        slug: 'bandung',
        isActive: true,
        sortOrder: 2,
      });
      await cityRepository.create({
        name: 'Surabaya',
        slug: 'surabaya',
        isActive: true,
        sortOrder: 3,
      });
      logger.info('Created 3 cities (Jakarta, Bandung, Surabaya)');
    } else {
      jakarta = await cityRepository.findBySlug('jakarta');
      logger.info('Cities already exist, skipping city seed');
    }

    if (jakarta) {
      const existingCinemas = await cinemaRepository.findAll({
        cityId: String(jakarta._id),
        page: 1,
        limit: 1,
        skip: 0,
        sort: { sortOrder: 1 },
      });

      if (existingCinemas.pagination.total === 0) {
        const cityId = jakarta._id as ICity['_id'];
        const cinemas = [
          {
            name: 'Grand Indonesia',
            cityId,
            address: 'Jl. M.H. Thamrin No.1, Jakarta',
            isActive: true,
            sortOrder: 1,
          },
          {
            name: 'Plaza Indonesia',
            cityId,
            address: 'Jl. M.H. Thamrin Kav. 28-30, Jakarta',
            isActive: true,
            sortOrder: 2,
          },
          {
            name: 'Senayan City',
            cityId,
            address: 'Jl. Asia Afrika No.19, Jakarta',
            isActive: true,
            sortOrder: 3,
          },
        ];

        for (const cinema of cinemas) {
          await cinemaRepository.create(cinema);
        }

        logger.info(`Created ${cinemas.length} cinemas in Jakarta`);
      } else {
        logger.info('Cinemas already exist for Jakarta, skipping cinema seed');
      }
    }

    logger.info('Seed completed successfully');
  } catch (error) {
    logger.error('Seed failed', { error });
    process.exit(1);
  } finally {
    await disconnectDatabase();
    await mongoose.connection.close();
  }
};

seed();
