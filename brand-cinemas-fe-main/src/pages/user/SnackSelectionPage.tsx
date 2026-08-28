import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { IMovie, IShowtime, IFoodItem, IOrderItem } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import BookingProgress from '@/components/BookingProgress';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { getShowtimeTicketPrice } from '@/utils/showtime';
import { foodService } from '@/services/foodService';

interface SeatSelectionData {
  movieId: string;
  showtimeId: string;
  selectedSeats: string[];
  totalAmount: number;
}

const categoryLabels: Record<string, string> = {
  popcorn: 'Popcorn',
  minuman: 'Minuman',
  snack: 'Snack',
};

export default function SnackSelectionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [foodItems, setFoodItems] = useState<IFoodItem[]>([]);
  const [orderItems, setOrderItems] = useState<IOrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [movie, setMovie] = useState<IMovie | null>(null);
  const [showtime, setShowtime] = useState<IShowtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const selectionData = sessionStorage.getItem('seatSelection');
      if (!selectionData) {
        toast.error('No booking data found');
        navigate('/movies');
        return;
      }

      const selection: SeatSelectionData = JSON.parse(selectionData);
      setSelectedSeats(selection.selectedSeats);
      setTotalAmount(selection.totalAmount);

      const [movieData, showtimeData, foodData] = await Promise.all([
        movieService.getMovieById(selection.movieId),
        showtimeService.getShowtimeById(selection.showtimeId),
        foodService.getFoodItems(),
      ]);

      setMovie(movieData);
      setShowtime(showtimeData);
      setFoodItems(foodData.filter((f) => f.is_available));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
      navigate('/movies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (foodItem: IFoodItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.foodItem._id === foodItem._id);
      if (existing) {
        return prev.map((item) =>
          item.foodItem._id === foodItem._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { foodItem, quantity: 1 }];
    });
  };

  const handleRemoveItem = (foodItemId: string) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.foodItem._id === foodItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.foodItem._id === foodItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.foodItem._id !== foodItemId);
    });
  };

  const handleClearItem = (foodItemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.foodItem._id !== foodItemId));
  };

  const snackTotal = orderItems.reduce((sum, item) => sum + item.foodItem.price * item.quantity, 0);
  const grandTotal = totalAmount + snackTotal;
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToPayment = () => {
    setShowCheckoutModal(true);
  };

  const handleSkipSnacks = () => {
    setOrderItems([]);
    setShowCheckoutModal(true);
  };

  const confirmCheckout = () => {
    const selectionData = sessionStorage.getItem('seatSelection');
    if (!selectionData) return;

    const selection: SeatSelectionData = JSON.parse(selectionData);
    const updatedSelection = {
      ...selection,
      orderItems,
      snackTotal,
      totalAmount: grandTotal,
    };

    sessionStorage.setItem('seatSelection', JSON.stringify(updatedSelection));
    navigate('/payment');
  };

  const filteredItems = activeCategory === 'all'
    ? foodItems
    : foodItems.filter((item) => item.category === activeCategory);

  const categories = ['all', 'popcorn', 'minuman', 'snack'];

  if (loading) {
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
          <BookingProgress currentStep="snacks" />
          <div></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="section-eyebrow mb-2">Add-ons</p>
          <h1 className="text-3xl font-bold font-display">Choose Your Snacks</h1>
          <p className="mt-2 text-gray-500 dark:text-slate-400">Complete your cinema experience with our delicious snacks and drinks.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    activeCategory === cat
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-800 dark:text-slate-300 dark:hover:bg-dark-700'
                  }`}
                >
                  {cat === 'all' ? 'All' : categoryLabels[cat]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const orderItem = orderItems.find((o) => o.foodItem._id === item._id);
                const quantity = orderItem?.quantity || 0;

                return (
                  <div key={item._id} className="card p-4 flex gap-4 border-0">
                    <img
                      src={item.image_url || 'https://via.placeholder.com/100'}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                        <span className="inline-block rounded-full bg-primary-500/20 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300 mt-1">
                          {categoryLabels[item.category]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-accent-500 dark:text-accent-300 font-bold">IDR {item.price.toLocaleString()}</span>
                        {quantity === 0 ? (
                          <button
                            onClick={() => handleAddItem(item)}
                            className="btn btn-primary px-3 py-1 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRemoveItem(item._id)}
                              className="btn btn-secondary p-1"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <button
                              onClick={() => handleAddItem(item)}
                              className="btn btn-primary p-1"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="cinema-panel sticky top-24 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-5 w-5 text-[#D5A527]" />
                <h3 className="text-xl font-semibold">Your Order</h3>
              </div>

              {movie && showtime && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-sm text-gray-600 dark:bg-dark-950 dark:text-slate-300">
                  <div className="mb-2 flex justify-between"><span>Movie</span><span className="font-semibold text-gray-900 dark:text-white">{movie.title}</span></div>
                  <div className="mb-2 flex justify-between"><span>Studio</span><span className="font-semibold text-gray-900 dark:text-white">{showtime.hall.hall_name}</span></div>
                  <div className="mb-2 flex justify-between"><span>Date</span><span className="font-semibold text-gray-900 dark:text-white">{new Date(showtime.show_date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>Time</span><span className="font-semibold text-gray-900 dark:text-white">{showtime.start_time}</span></div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 dark:border-dark-700">
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">Tickets ({selectedSeats.length})</p>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-slate-400">{selectedSeats.length} x IDR {showtime ? getShowtimeTicketPrice(showtime).toLocaleString('id-ID') : '0'}</span>
                  <span className="text-gray-900 dark:text-white">IDR {totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-slate-500">{selectedSeats.join(', ')}</div>
              </div>

              {orderItems.length > 0 && (
                <div className="border-t border-gray-200 pt-4 dark:border-dark-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">Snacks ({totalQuantity})</p>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {orderItems.map((item) => (
                      <li key={item.foodItem._id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white">{item.foodItem.name}</span>
                          <span className="text-gray-400">x{item.quantity}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white">IDR {(item.foodItem.price * item.quantity).toLocaleString()}</span>
                          <button
                            onClick={() => handleClearItem(item.foodItem._id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4 dark:border-dark-700">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-accent-500 dark:text-accent-300">IDR {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                className="btn btn-primary w-full mt-6 py-3 text-lg"
              >
                Continue to Payment
              </button>

              <button
                onClick={handleSkipSnacks}
                className="btn btn-secondary w-full mt-2 py-2 text-sm"
              >
                Skip, I don't want snacks
              </button>
            </div>
          </div>
        </div>
      </main>

      {showCheckoutModal && showtime && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-lg relative">
            <button onClick={() => setShowCheckoutModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Review Your Booking</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              Please double-check your booking details before proceeding to payment.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-dark-800/50">
                {movie && (
                  <>
                    <img src={movie.poster_url} alt={movie.title} className="w-12 h-16 rounded object-cover" />
                    <div>
                      <p className="font-semibold">{movie.title}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{movie.genre} &bull; {movie.duration} min</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-800/50">
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Date</p>
                  <p className="font-medium">{new Date(showtime.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-800/50">
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Time</p>
                  <p className="font-medium">{showtime.start_time}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-800/50">
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Studio</p>
                  <p className="font-medium">{showtime.hall.hall_name}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-800/50">
                  <p className="text-gray-500 dark:text-slate-400 text-xs">Seats</p>
                  <p className="font-medium">{selectedSeats.join(', ')}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 dark:border-dark-700">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-slate-400">Tickets ({selectedSeats.length} x IDR {getShowtimeTicketPrice(showtime).toLocaleString('id-ID')})</span>
                  <span className="font-medium">IDR {totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-slate-500 mb-3">{selectedSeats.join(', ')}</div>
                {orderItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {orderItems.map((item) => (
                      <div key={item.foodItem._id} className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-slate-400">{item.foodItem.name} x{item.quantity}</span>
                        <span className="font-medium">IDR {(item.foodItem.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <span className="font-semibold">Total Payment</span>
                <span className="text-lg font-bold text-accent-500 dark:text-accent-300">
                  IDR {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowCheckoutModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmCheckout} className="btn btn-primary">
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
