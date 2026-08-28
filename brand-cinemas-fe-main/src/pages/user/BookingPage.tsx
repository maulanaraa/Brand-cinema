import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Armchair, CalendarDays, Clock, MapPin, X } from 'lucide-react';
import { IMovie, IShowtime } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import BookingProgress from '@/components/BookingProgress';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { bookingService } from '@/services/bookingService';
import { ApiError } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { generateSeatCodes, getShowtimeTicketPrice, groupSeatsByRow, filterBookableShowtimes, isShowtimeBookable } from '@/utils/showtime';

export default function BookingPage() {
  const { movieId } = useParams<{ movieId: string }>();
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [movie, setMovie] = useState<IMovie | null>(null);
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<IShowtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [conflictSeats, setConflictSeats] = useState<string[]>([]);
  const [totalSeat, setTotalSeat] = useState(50);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (showtimeId) {
      fetchFromShowtime(showtimeId);
    } else if (movieId) {
      fetchMovieAndShowtimes(movieId);
    }
  }, [movieId, showtimeId]);

  useEffect(() => {
    if (selectedShowtime) {
      fetchOccupiedSeats(selectedShowtime._id);
    }
  }, [selectedShowtime]);

  const fetchMovieAndShowtimes = async (id: string) => {
    try {
      const [movieData, showtimesData] = await Promise.all([
        movieService.getMovieById(id),
        showtimeService.getMovieShowtimes(id)
      ]);

      setMovie(movieData);
      const bookable = filterBookableShowtimes(showtimesData || []);
      setShowtimes(bookable);
      if (bookable.length > 0) {
        setSelectedDate(bookable[0].show_date.split('T')[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFromShowtime = async (id: string) => {
    try {
      const showtime = await showtimeService.getShowtimeById(id);
      const showtimesData = await showtimeService.getMovieShowtimes(showtime.movie._id);
      const bookable = filterBookableShowtimes(showtimesData);
      setMovie(showtime.movie);
      setShowtimes(bookable);

      if (!isShowtimeBookable(showtime)) {
        toast.error('This showtime has already started or passed');
        setSelectedShowtime(null);
        if (bookable.length > 0) {
          setSelectedDate(bookable[0].show_date.split('T')[0]);
        }
        return;
      }

      setSelectedShowtime(showtime);
      setSelectedDate(showtime.show_date.split('T')[0]);
    } catch (error) {
      console.error('Error fetching showtime:', error);
      toast.error('Failed to load showtime details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupiedSeats = async (showtimeId: string) => {
    try {
      const seatMap = await showtimeService.getShowtimeSeats(showtimeId);
      setOccupiedSeats(seatMap.bookedSeats);
      setTotalSeat(seatMap.totalSeat);
    } catch {
      try {
        const booked = await bookingService.getSeatAvailability(showtimeId);
        setOccupiedSeats(booked);
        setTotalSeat(selectedShowtime?.totalSeat || selectedShowtime?.hall.total_seats || 50);
      } catch {
        toast.error('Could not load seat information.');
      }
    }
  };

  const seatCodes = generateSeatCodes(totalSeat);
  const seatRows = groupSeatsByRow(seatCodes);

  const getSeatCategory = (seatId: string) => {
    const row = seatId.charAt(0);
    if (row === 'H' || row === 'I') return 'premiere';
    if (row === 'J') return 'couple';
    return 'regular';
  };

  const handleSeatClick = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;

    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(s => s !== seatId) 
        : [...prev, seatId]
    );
  };

  const handleProceedToPayment = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      toast.error('Please select a showtime and at least one seat');
      return;
    }

    if (!isShowtimeBookable(selectedShowtime)) {
      toast.error('This showtime has already started or passed');
      setSelectedShowtime(null);
      setSelectedSeats([]);
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: { pathname: `/booking/${selectedShowtime._id}` } } });
      return;
    }

    setSubmitting(true);
    setConflictSeats([]);

    try {
      const created = await bookingService.createBooking({
        showtimeId: selectedShowtime._id,
        selectedSeats,
      });
      navigate(`/bookings/${created._id}/summary`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const unavailable = err.unavailableSeats;
        setConflictSeats(unavailable);
        setSelectedSeats((prev) => prev.filter((seat) => !unavailable.includes(seat)));
        await fetchOccupiedSeats(selectedShowtime._id);
        toast.error(
          unavailable.length
            ? `Seats unavailable: ${unavailable.join(', ')}`
            : 'Some seats are no longer available. Please select again.',
        );
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to create booking');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const availableDates = [...new Set(showtimes.map((s) => s.show_date.split('T')[0]))];
  const filteredShowtimes = showtimes.filter((s) => s.show_date.startsWith(selectedDate));

  if (loading || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-dark-950 dark:text-white">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-dark-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/movies" className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <BookingProgress currentStep="selection" />
          <div></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-6 rounded-lg border border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center dark:border-white/10 dark:bg-dark-900/70">
          <img src={movie.poster_url} alt={movie.title} className="w-24 rounded-md shadow-lg sm:w-28"/>
          <div>
            <p className="section-eyebrow mb-2">Reserve seats</p>
            <h1 className="text-3xl font-bold font-display">{movie.title}</h1>
            <p className="text-gray-500 dark:text-slate-400">{movie.genre} • {movie.duration} minutes • {movie.classification || 'All audience'}</p>
          </div>
        </div>
        
        <div className="cinema-panel mb-8 p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="section-eyebrow mb-2">Schedule</p>
                <h2 className="text-xl font-semibold">Choose Date & Time</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-[#D5A527]" />
                CinemaID Grand Indonesia
              </div>
            </div>
            {availableDates.length > 1 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {availableDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setSelectedShowtime(null); setSelectedSeats([]); }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                      selectedDate === date
                        ? 'bg-primary-500/15 border-primary-500 text-primary-500'
                        : 'border-transparent bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                    }`}
                  >
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3 overflow-x-auto pb-1">
            {filteredShowtimes.map((showtime) => (
                <button
                    key={showtime._id}
                    type="button"
                    className={`min-w-44 rounded-lg border p-4 text-left transition ${
                      selectedShowtime?._id === showtime._id
                        ? 'bg-primary-500/15 border-primary-500 text-primary-500'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-500/60 dark:border-white/10 dark:bg-dark-950 dark:text-slate-200'
                    }`}
                    onClick={() => {
                      if (!isShowtimeBookable(showtime)) {
                        toast.error('This showtime has already started or passed');
                        return;
                      }
                      setSelectedShowtime(showtime);
                      setSelectedSeats([]);
                    }}
                >
                    <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-75">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(showtime.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="block text-2xl font-black">{showtime.start_time}</span>
                    <span className="mt-1 flex items-center gap-2 text-sm opacity-80">
                      <Clock className="h-4 w-4" />
                      {showtime.hall.hall_name}
                    </span>
                </button>
            ))}
            {filteredShowtimes.length === 0 && (
              <p className="py-2 text-sm text-gray-500 dark:text-slate-400">
                No upcoming showtimes for this date.
              </p>
            )}
            </div>
        </div>

        {selectedShowtime && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 cinema-panel p-4 sm:p-6">
              <div className="mx-auto mb-10 max-w-3xl">
                <div className="h-10 rounded-t-full border-t-4 border-accent-300 bg-gradient-to-b from-accent-400/30 to-transparent text-center text-xs font-bold uppercase tracking-[0.35em] text-accent-200">
                  Screen
                </div>
              </div>
              <div className="mx-auto mb-6 max-w-3xl space-y-2 overflow-x-auto pb-2">
                  {seatRows.map((row) => (
                    <div key={row} className="grid min-w-[430px] grid-cols-[24px_repeat(10,1fr)_24px] items-center gap-2">
                      <span className="text-center text-xs font-bold text-gray-400 dark:text-slate-500">{row}</span>
                      {seatCodes.filter((seat) => seat.startsWith(row)).map((seat) => {
                        const category = getSeatCategory(seat);
                        const isOccupied = occupiedSeats.includes(seat);
                        const isConflict = conflictSeats.includes(seat);
                        return (
                        <button
                          key={seat}
                          onClick={() => handleSeatClick(seat)}
                          disabled={isOccupied}
                          className={`seat mx-auto ${
                            isOccupied || isConflict
                              ? 'seat-occupied ring-2 ring-red-500'
                              : selectedSeats.includes(seat)
                              ? 'seat-selected'
                              : category === 'premiere' || category === 'couple'
                              ? 'seat-premiere'
                              : 'seat-available'
                          }`}
                          aria-label={`Seat ${seat}`}
                        >
                          {seat.replace(row, '')}
                        </button>
                      )})}
                      <span className="text-center text-xs font-bold text-gray-400 dark:text-slate-500">{row}</span>
                    </div>
                  ))}
              </div>
               <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-slate-300">
                  <div className="flex items-center space-x-2"><div className="seat seat-available h-4 w-4"></div><span>Regular</span></div>
                  <div className="flex items-center space-x-2"><div className="seat seat-premiere h-4 w-4"></div><span>Premiere</span></div>
                  <div className="flex items-center space-x-2"><div className="seat seat-selected h-4 w-4"></div><span>Selected</span></div>
                  <div className="flex items-center space-x-2"><div className="seat seat-occupied h-4 w-4"></div><span>Occupied</span></div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="cinema-panel sticky top-24 p-6">
                <p className="section-eyebrow mb-2">Order</p>
                <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
                <div className="mb-5 rounded-md bg-white p-4 text-sm text-gray-600 dark:bg-dark-950 dark:text-slate-300">
                  <div className="mb-2 flex justify-between"><span>Studio</span><span className="font-semibold text-gray-900 dark:text-white">{selectedShowtime.hall.hall_name}</span></div>
                  <div className="mb-2 flex justify-between"><span>Date</span><span className="font-semibold text-gray-900 dark:text-white">{new Date(selectedShowtime.show_date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>Time</span><span className="font-semibold text-gray-900 dark:text-white">{selectedShowtime.start_time}</span></div>
                </div>
                <ul className="mb-4 max-h-44 space-y-2 overflow-y-auto">
                  {selectedSeats.map(seat => (
                    <li key={seat} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-white/5">
                      <span className="inline-flex items-center gap-2"><Armchair className="h-4 w-4 text-[#D5A527]" /> Seat {seat}</span>
                      <button
                        onClick={() => handleSeatClick(seat)}
                        className="text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                        aria-label={`Remove seat ${seat}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                  {selectedSeats.length === 0 && <p className="text-gray-500 dark:text-slate-400">No seats selected.</p>}
                </ul>
                <div className="border-t border-gray-200 pt-4 dark:border-dark-700">
                    <div className="mb-2 flex justify-between text-sm text-gray-500 dark:text-slate-400">
                      <span>{selectedSeats.length} ticket(s)</span>
                      <span>IDR {getShowtimeTicketPrice(selectedShowtime).toLocaleString('id-ID')} each</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-accent-500 dark:text-accent-300">IDR {(selectedSeats.length * getShowtimeTicketPrice(selectedShowtime)).toLocaleString('id-ID')}</span>
                    </div>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  disabled={selectedSeats.length === 0 || submitting}
                  className="btn btn-primary w-full mt-6 py-3 text-lg"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
